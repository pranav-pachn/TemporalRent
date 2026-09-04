import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/lib/prisma';
import { signAccessToken } from '../src/lib/jwt';

describe('Phase 11: Booking Domain', () => {
  let businessId: string;
  let token: string;
  let userId: string;
  let customerId: string;
  let inventoryItemId: string;
  let bookingId: string;

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: { name: 'Phase 11 Biz', slug: `phase11-${Date.now()}` },
    });
    businessId = biz.id;

    const user = await prisma.user.create({
      data: { businessId, email: 'phase11@test.com', passwordHash: 'hash', role: 'OWNER' },
    });
    userId = user.id;
    token = await signAccessToken({ userId: user.id, businessId, role: 'OWNER' });

    const customer = await prisma.customer.create({ data: { businessId, name: 'Cust A' } });
    customerId = customer.id;

    const item = await prisma.inventoryItem.create({
      data: { businessId, name: 'Sofa', totalQty: 10 },
    });
    inventoryItemId = item.id;
  });

  it('creates a draft booking', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        eventName: 'Test Event',
        eventStart: '2026-10-01T10:00:00Z',
        eventEnd: '2026-10-01T12:00:00Z',
        lines: [
          { type: 'INVENTORY_ITEM', inventoryItemId, quantity: 2 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    bookingId = res.body.data.id;

    const demands = await prisma.bookingItemDemand.findMany({ where: { bookingId } });
    expect(demands.length).toBe(1);
    expect(demands[0].quantityDemanded).toBe(2);
  });

  it('cancels a booking transactionally', async () => {
    // 1. Manually add an ACTIVE reservation to verify it gets cancelled
    await prisma.$executeRaw`
      INSERT INTO "inventory_reservations" ("id", "businessId", "inventoryItemId", "bookingId", "quantity", "period", "status", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${businessId}, ${inventoryItemId}, ${bookingId}, 2, tstzrange('2026-10-01 10:00:00+00', '2026-10-01 12:00:00+00', '[)'), 'ACTIVE', NOW(), NOW())
    `;

    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'idem-cancel-1');

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CANCELLED');

    // Verify booking status
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(booking?.status).toBe('CANCELLED');

    // Verify reservation status
    const reservations = await prisma.inventoryReservation.findMany({ where: { bookingId } });
    expect(reservations.length).toBe(1);
    expect(reservations[0].status).toBe('CANCELLED');

    // Verify audit event
    const audits = await prisma.auditEvent.findMany({ where: { recordId: bookingId } });
    expect(audits.length).toBe(1);
    expect(audits[0].action).toBe('UPDATE');
    
    const afterPayload = audits[0].after as any;
    expect(afterPayload.status).toBe('CANCELLED');
  });

  it('rejects double cancellation with 409', async () => {
    const res = await request(app)
      .post(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .set('Idempotency-Key', 'idem-cancel-2');

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_STATUS_TRANSITION');

    // Should not create duplicate audit logs
    const audits = await prisma.auditEvent.findMany({ where: { recordId: bookingId } });
    expect(audits.length).toBe(1); 
  });
});
