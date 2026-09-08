import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';
import { AuditAction, AuditEntityType } from '@prisma/client';

describe('End-to-End API Lifecycle Test', () => {
  let businessId: string;
  let token: string;
  let userId: string;
  let customerId: string;
  let inventoryItemId: string;
  let bookingId: string;
  let dispatchId: string;

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: { name: 'E2E Biz', slug: `e2e-${Date.now()}` },
    });
    businessId = biz.id;

    const user = await prisma.user.create({
      data: { businessId, email: `e2e-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN' },
    });
    userId = user.id;
    token = await signAccessToken({ userId: user.id, businessId, role: 'ADMIN' });

    const customer = await prisma.customer.create({
      data: { businessId, name: 'E2E Customer', email: 'e2e@test.com' },
    });
    customerId = customer.id;

    const category = await prisma.category.create({
      data: { businessId, name: 'Furniture' },
    });

    const item = await prisma.inventoryItem.create({
      data: { businessId, categoryId: category.id, name: 'E2E Sofa', sku: 'E2E-SOFA', totalQty: 100 },
    });
    inventoryItemId = item.id;
  });

  it('1. Create DRAFT Booking', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        eventName: 'E2E Wedding',
        eventStart: new Date('2030-05-01T10:00:00Z').toISOString(),
        eventEnd: new Date('2030-05-05T10:00:00Z').toISOString(),
        lines: [
          { type: 'INVENTORY_ITEM', inventoryItemId, quantity: 10 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    bookingId = res.body.data.id;
  });

  it('2. Quote Booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('QUOTED');
  });

  it('3. Confirm Booking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'e2e-confirm-1');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
  });

  it('4. Prepare Dispatch', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/dispatch/prepare`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('READY');
    expect(res.body.data.lines).toHaveLength(1);
    dispatchId = res.body.data.id;
  });

  it('5. Start Picking', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/dispatch/start-picking`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PICKING');
  });

  it('6. Confirm Dispatch', async () => {
    // Need the dispatchLineId
    const dispatchLines = await prisma.dispatchLine.findMany({ where: { dispatchId } });
    
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/dispatch/confirm`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'e2e-dispatch-1')
      .send({
        lines: [
          { dispatchLineId: dispatchLines[0].id, dispatchedQty: 10 }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DISPATCHED');
  });

  it('7. Complete Return', async () => {
    const dispatchLines = await prisma.dispatchLine.findMany({ where: { dispatchId } });

    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/return/complete`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'e2e-return-1')
      .send({
        lines: [
          { dispatchLineId: dispatchLines[0].id, returnedGoodQty: 9, damagedQty: 1, missingQty: 0, damageDetails: 'Spill' }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('8. Validate Audit Timeline via API', async () => {
    const res = await request(app)
      .get(`/api/v1/bookings/${bookingId}/audit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    
    const audits = res.body.data;
    
    // We expect:
    // 1. UPDATE (QUOTED)
    // 2. CONFIRM
    // 3. CREATE (READY dispatch)
    // 4. START_PICKING
    // 5. DISPATCH
    // 6. DAMAGE (Item)
    // 7. RETURN

    expect(audits).toHaveLength(7);
    const actions = audits.map((a: any) => a.action);
    expect(actions).toEqual([
      AuditAction.UPDATE, 
      AuditAction.CONFIRM, 
      AuditAction.CREATE, 
      AuditAction.START_PICKING, 
      AuditAction.DISPATCH, 
      AuditAction.DAMAGE, 
      AuditAction.RETURN
    ]);

    // Check chronology order by createdAt is preserved (since the queries order by createdAt ASC, id ASC)
    for (let i = 0; i < audits.length - 1; i++) {
      const current = new Date(audits[i].createdAt).getTime();
      const next = new Date(audits[i+1].createdAt).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });
});
