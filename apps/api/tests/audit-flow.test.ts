import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';
import { AuditAction, AuditEntityType } from '@prisma/client';

describe('Audit Flow Integration', () => {
  let businessAId: string;
  let userAId: string;
  let authTokenA: string;

  let businessBId: string;
  let authTokenB: string;

  let customerId: string;
  let inventoryItemId: string;
  let bookingId: string;
  let dispatchId: string;

  beforeAll(async () => {
    // Seed Business A
    const bA = await prisma.business.create({
      data: { name: 'Audit Test A', slug: `audit-test-a-${Date.now()}` }
    });
    businessAId = bA.id;
    const uA = await prisma.user.create({
      data: { businessId: bA.id, email: `a-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN' }
    });
    userAId = uA.id;
    authTokenA = await signAccessToken({ userId: uA.id, businessId: bA.id, role: 'ADMIN' });

    // Seed Business B
    const bB = await prisma.business.create({
      data: { name: 'Audit Test B', slug: `audit-test-b-${Date.now()}` }
    });
    businessBId = bB.id;
    const uB = await prisma.user.create({
      data: { businessId: bB.id, email: `b-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN' }
    });
    authTokenB = await signAccessToken({ userId: uB.id, businessId: bB.id, role: 'ADMIN' });

    const customer = await prisma.customer.create({
      data: { businessId: bA.id, name: 'Audit Customer', email: 'audit@test.com' }
    });
    customerId = customer.id;

    const item = await prisma.inventoryItem.create({
      data: { businessId: bA.id, name: 'Audit Item', totalQty: 10 }
    });
    inventoryItemId = item.id;
  });

  it('creates and confirms a booking, checking audit events', async () => {
    // 1. Create Booking
    const createRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authTokenA}`)
      .send({
        customerId,
        type: 'INTERNAL',
        status: 'DRAFT',
        eventName: 'Test Event',
        eventStart: new Date(Date.now() + 86400000).toISOString(),
        eventEnd: new Date(Date.now() + 172800000).toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId, quantity: 2 }]
      });

    expect(createRes.status).toBe(201);
    bookingId = createRes.body.data.id;

    // 2. Quote and Confirm Booking
    await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set('Authorization', `Bearer ${authTokenA}`);

    const confirmRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${authTokenA}`)
      .set('Idempotency-Key', 'confirm-1');
    expect(confirmRes.status).toBe(200);

    // Verify CONFIRM audit
    let auditRes = await request(app)
      .get(`/api/v1/audit?entityType=BOOKING&entityId=${bookingId}`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    expect(auditRes.body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'CONFIRM', entityType: 'BOOKING' })
      ])
    );
  });

  it('progresses dispatch, checking audit events', async () => {
    // Find auto-created dispatch
    const dispatchRes = await request(app)
      .get(`/api/v1/bookings/${bookingId}/dispatch`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    dispatchId = dispatchRes.body.data.id;

    // Start picking
    await request(app)
      .post(`/api/v1/bookings/${bookingId}/dispatch/start-picking`)
      .set('Authorization', `Bearer ${authTokenA}`);

    let auditRes = await request(app)
      .get(`/api/v1/audit?entityType=DISPATCH&entityId=${dispatchId}`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    expect(auditRes.body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'START_PICKING', entityType: 'DISPATCH' })
      ])
    );

    // Dispatch
    const lines = dispatchRes.body.data[0].lines.map((l: any) => ({
      dispatchLineId: l.id,
      dispatchedQty: l.quantityExpected
    }));

    await request(app)
      .post(`/api/v1/bookings/${bookingId}/dispatch/confirm`)
      .set('Authorization', `Bearer ${authTokenA}`)
      .set('Idempotency-Key', 'dispatch-1')
      .send({ lines });

    auditRes = await request(app)
      .get(`/api/v1/audit?entityType=DISPATCH&entityId=${dispatchId}`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    expect(auditRes.body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'DISPATCH', entityType: 'DISPATCH' })
      ])
    );
  });

  it('returns and reports damage, checking audit events', async () => {
    const dispatchRes = await request(app)
      .get(`/api/v1/bookings/${bookingId}/dispatch`)
      .set('Authorization', `Bearer ${authTokenA}`);
      
    // Return with damage
    const lines = [{
      dispatchLineId: dispatchRes.body.data.lines[0].id,
      returnedGoodQty: 1,
      damagedQty: 1,
      missingQty: 0,
      damageDetails: 'Broken leg'
    }];

    await request(app)
      .post(`/api/v1/bookings/${bookingId}/return/complete`)
      .set('Authorization', `Bearer ${authTokenA}`)
      .set('Idempotency-Key', 'return-1')
      .send({ lines });

    // We should have RETURN and DAMAGE audit events
    const auditRes = await request(app)
      .get(`/api/v1/audit?bookingId=${bookingId}`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    expect(auditRes.body.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: 'RETURN', entityType: 'RETURN' }),
        expect.objectContaining({ action: 'DAMAGE', entityType: 'INVENTORY_ITEM' })
      ])
    );
  });

  it('verifies rollback atomicity: confirmation failure prevents audit creation', async () => {
    // 1. Create Booking with impossible quantity to force confirmation failure
    const failCreateRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authTokenA}`)
      .send({
        customerId,
        type: 'INTERNAL',
        status: 'DRAFT',
        eventName: 'Fail Event',
        eventStart: new Date(Date.now() + 86400000).toISOString(),
        eventEnd: new Date(Date.now() + 172800000).toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId, quantity: 9999 }] // Exceeds capacity
      });

    const failBookingId = failCreateRes.body.data.id;

    // Quote
    await request(app)
      .post(`/api/v1/bookings/${failBookingId}/quote`)
      .set('Authorization', `Bearer ${authTokenA}`);

    // Try to confirm (should fail because of inventory)
    const failConfirmRes = await request(app)
      .post(`/api/v1/bookings/${failBookingId}/confirm`)
      .set('Authorization', `Bearer ${authTokenA}`)
      .set('Idempotency-Key', 'fail-confirm-1');
    
    // Expect failure
    expect(failConfirmRes.status).toBe(409);

    // Verify NO audit events were created
    const auditRes = await request(app)
      .get(`/api/v1/audit?entityType=BOOKING&entityId=${failBookingId}`)
      .set('Authorization', `Bearer ${authTokenA}`);
    
    expect(auditRes.body.events.length).toBe(0);
  });

  it('enforces tenant isolation', async () => {
    // Business B asks for audits
    const auditResB = await request(app)
      .get(`/api/v1/audit`)
      .set('Authorization', `Bearer ${authTokenB}`);

    // Business B should see NO audit events from A
    expect(auditResB.body.events.length).toBe(0);

    const customerB = await prisma.customer.create({
      data: { businessId: businessBId, name: 'Audit Customer B', email: 'b@test.com' }
    });

    // Just to be sure, create an event in B
    const createBRes = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${authTokenB}`)
      .send({
        customerId: customerB.id,
        type: 'INTERNAL',
        status: 'DRAFT',
        eventName: 'Test B',
        eventStart: new Date(Date.now() + 86400000).toISOString(),
        eventEnd: new Date(Date.now() + 172800000).toISOString(),
        lines: []
      });

    const bId = createBRes.body.data.id;
    await request(app)
      .post(`/api/v1/bookings/${bId}/quote`)
      .set('Authorization', `Bearer ${authTokenB}`);
    await request(app)
      .post(`/api/v1/bookings/${bId}/confirm`)
      .set('Authorization', `Bearer ${authTokenB}`)
      .set('Idempotency-Key', 'confirm-B');

    const auditResBAfter = await request(app)
      .get(`/api/v1/audit`)
      .set('Authorization', `Bearer ${authTokenB}`);
    
    // Should only see B's event
    expect(auditResBAfter.body.events.length).toBe(1);
    expect(auditResBAfter.body.events[0].businessId).toBe(businessBId);
  });
});
