import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import { signAccessToken } from '../../src/lib/jwt';

describe('Concurrency API Stress Test', () => {
  let businessId: string;
  let token: string;
  let userId: string;
  let customerId: string;
  let inventoryItemId: string;
  let bookingId: string;

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: { name: 'Stress Biz', slug: `stress-${Date.now()}` },
    });
    businessId = biz.id;

    const user = await prisma.user.create({
      data: { businessId, email: `stress-${Date.now()}@test.com`, passwordHash: 'hash', role: 'ADMIN' },
    });
    userId = user.id;
    token = await signAccessToken({ userId: user.id, businessId, role: 'ADMIN' });

    const customer = await prisma.customer.create({
      data: { businessId, name: 'Stress Customer', email: 'stress@test.com' },
    });
    customerId = customer.id;

    const category = await prisma.category.create({
      data: { businessId, name: 'Stress Furniture' },
    });

    const item = await prisma.inventoryItem.create({
      data: { businessId, categoryId: category.id, name: 'Stress Sofa', sku: 'STRESS-SOFA', totalQty: 2 },
    });
    inventoryItemId = item.id;
  });

  it('sets up the initial booking state', async () => {
    const res = await request(app)
      .post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        eventName: 'Stress Test Event',
        eventStart: new Date('2030-06-01T10:00:00Z').toISOString(),
        eventEnd: new Date('2030-06-05T10:00:00Z').toISOString(),
        lines: [
          { type: 'INVENTORY_ITEM', inventoryItemId, quantity: 2 }
        ]
      });

    expect(res.status).toBe(201);
    bookingId = res.body.data.id;

    const quoteRes = await request(app)
      .post(`/api/v1/bookings/${bookingId}/quote`)
      .set('Authorization', `Bearer ${token}`);
    
    expect(quoteRes.status).toBe(200);
  });

  it('handles 50 concurrent confirm requests idempotently and without deadlocks', async () => {
    const REQUEST_COUNT = 50;
    const idempotencyKey = `stress-confirm-${Date.now()}`;

    // Fire 50 requests perfectly concurrently
    const requests = Array.from({ length: REQUEST_COUNT }).map(() => {
      return request(app)
        .post(`/api/v1/bookings/${bookingId}/confirm`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', idempotencyKey);
    });

    const responses = await Promise.all(requests);

    const statuses = responses.map(r => r.status);
    
    // Exactly 1 request should process normally (200 OK)
    // The others should return 200 OK (Idempotency cached response) 
    // OR 409 Conflict if they beat the idempotency cache but hit the state machine lock
    // Let's verify no 500 Internal Server Errors occurred (no deadlocks)
    
    const count200 = statuses.filter(s => s === 200).length;
    const count409 = statuses.filter(s => s === 409).length;
    const count500 = statuses.filter(s => s >= 500).length;

    expect(count500).toBe(0); // NO Deadlocks or server crashes
    expect(count200 + count409).toBe(REQUEST_COUNT); // All should be correctly handled

    // Ensure only 1 actual CONFIRM audit event was created
    const audits = await prisma.auditEvent.findMany({
      where: {
        businessId,
        bookingId,
        action: 'CONFIRM'
      }
    });

    expect(audits).toHaveLength(1);
    
    // Ensure only 1 reservation was created
    const reservations = await prisma.inventoryReservation.findMany({
      where: { businessId, bookingId }
    });
    
    expect(reservations).toHaveLength(1);
    expect(reservations[0].quantity).toBe(2);
  }, 30000); // Higher timeout for heavy concurrent load
});
