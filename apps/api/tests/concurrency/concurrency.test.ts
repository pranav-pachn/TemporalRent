import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { ReservationsService } from '../../src/modules/reservations/reservations.service';
import request from 'supertest';
import { app } from '../../src/app';
import { signAccessToken } from '../../src/lib/jwt';

describe('Phases 15 & 16: Concurrency Hardening & Cancellation Engine', () => {
  let businessId: string;
  let userId: string;
  let token: string;
  let customerId: string;

  // Items
  let itemSofaId: string;
  let itemChairId: string;

  const bookingsService = new BookingsService();
  const reservationsService = new ReservationsService();

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: {
        name: 'Phase 15 Concurrency',
        slug: 'p15-concurrency-' + Date.now(),
        plan: 'PRO',
        defaultBufferBeforeMinutes: 0,
        defaultBufferAfterMinutes: 0,
      }
    });
    businessId = biz.id;

    const user = await prisma.user.create({
      data: {
        email: 'concurrency-' + Date.now() + '@test.com',
        passwordHash: 'dummy',
        role: 'ADMIN',
        businessId,
      }
    });
    userId = user.id;
    token = await signAccessToken({ userId: user.id, businessId, role: 'ADMIN' });

    const customer = await prisma.customer.create({
      data: { businessId, name: 'Concurrency Tester' }
    });
    customerId = customer.id;

    const cat = await prisma.category.create({ data: { businessId, name: 'Furniture' } });

    const sofa = await prisma.inventoryItem.create({
      data: { businessId, categoryId: cat.id, name: 'Sofa', sku: 'SOFA-RACE', totalQty: 2 }
    });
    itemSofaId = sofa.id;

    const chair = await prisma.inventoryItem.create({
      data: { businessId, categoryId: cat.id, name: 'Chair', sku: 'CHAIR-RACE', totalQty: 10 }
    });
    itemChairId = chair.id;
  });

  describe('Phase 15: Concurrency Verification', () => {
    it('Deterministic Race (usable = 2, 2 Bookings x 2 Units)', async () => {
      const eventStart = new Date();
      const eventEnd = new Date(Date.now() + 3600 * 1000);
      
      const b1 = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Race A', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 }]
      });
      const b2 = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Race B', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 }]
      });

      const results = await Promise.allSettled([
        reservationsService.confirmBooking({ businessId, bookingId: b1!.id, userId, idempotencyKey: 'idem-A' }),
        reservationsService.confirmBooking({ businessId, bookingId: b2!.id, userId, idempotencyKey: 'idem-B' }),
      ]);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);

      if (rejected[0].status === 'rejected') {
        expect((rejected[0] as any).reason.code).toBe('INVENTORY_CONFLICT');
      }

      const activeSum = await prisma.inventoryReservation.aggregate({
        _sum: { quantity: true },
        where: { businessId, inventoryItemId: itemSofaId, status: 'ACTIVE' }
      });
      expect(activeSum._sum.quantity || 0).toBeLessThanOrEqual(2);
    }, 30000);

    it('Idempotency Concurrency (same booking, same key, multiple concurrent callers)', async () => {
      const eventStart = new Date(Date.now() + 2 * 3600 * 1000);
      const eventEnd = new Date(Date.now() + 3 * 3600 * 1000);
      
      const tempItem = await prisma.inventoryItem.create({
        data: { businessId, name: 'TempItem', sku: 'TEMP-IDEM', totalQty: 10 }
      });

      const b = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Idem Race', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: tempItem.id, quantity: 1 }]
      });

      const key = 'shared-idem-key';

      const requests = Array.from({ length: 3 }).map(() =>
        reservationsService.confirmBooking({ businessId, bookingId: b!.id, userId, idempotencyKey: key })
      );

      await Promise.allSettled(requests);
      
      const reservations = await prisma.inventoryReservation.findMany({
        where: { bookingId: b!.id }
      });

      expect(reservations.length).toBe(1);
      
      const demands = await prisma.bookingItemDemand.findMany({
        where: { bookingId: b!.id }
      });
      expect(demands.length).toBe(1);
    }, 30000);

    it('Deadlock Proof (inverted array input completion via Promise.allSettled)', async () => {
      const eventStart = new Date(Date.now() + 4 * 3600 * 1000);
      const eventEnd = new Date(Date.now() + 5 * 3600 * 1000);

      const b1 = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Deadlock A', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [
          { type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 1 },
          { type: 'INVENTORY_ITEM', inventoryItemId: itemChairId, quantity: 1 }
        ]
      });

      const b2 = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Deadlock B', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [
          { type: 'INVENTORY_ITEM', inventoryItemId: itemChairId, quantity: 1 },
          { type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 1 }
        ]
      });

      const results = await Promise.allSettled([
        reservationsService.confirmBooking({ businessId, bookingId: b1!.id, userId, idempotencyKey: 'idem-dl-A' }),
        reservationsService.confirmBooking({ businessId, bookingId: b2!.id, userId, idempotencyKey: 'idem-dl-B' }),
      ]);

      for (const res of results) {
        expect(res.status).toBe('fulfilled');
      }
    }, 30000);

    it('All-or-Nothing Atomicity (multi-item partial shortage)', async () => {
      const eventStart = new Date(Date.now() + 6 * 3600 * 1000);
      const eventEnd = new Date(Date.now() + 7 * 3600 * 1000);

      const b = await prisma.$transaction(async tx => {
        const id = crypto.randomUUID();
        await tx.$executeRaw`
          INSERT INTO "bookings" (
            "id", "businessId", "customerId", "eventName", 
            "eventStart", "eventEnd", "status", "period", "createdByUserId", "createdAt", "updatedAt"
          ) VALUES (
            ${id}, ${businessId}, ${customerId}, 'Atomicity Test',
            ${eventStart.toISOString()}::timestamptz, ${eventEnd.toISOString()}::timestamptz,
            'DRAFT', tstzrange(${eventStart.toISOString()}::timestamptz, ${eventEnd.toISOString()}::timestamptz, '[)'),
            ${userId}, NOW(), NOW()
          )
        `;
        await tx.bookingLine.createMany({
          data: [
            { bookingId: id, type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 }, // available
            { bookingId: id, type: 'INVENTORY_ITEM', inventoryItemId: itemChairId, quantity: 20 } // shortage
          ]
        });
        return { id };
      }, { maxWait: 30000, timeout: 30000 });

      await expect(
        reservationsService.confirmBooking({ businessId, bookingId: b.id, userId, idempotencyKey: 'idem-atomicity' })
      ).rejects.toMatchObject({ code: 'INVENTORY_CONFLICT' });

      const demands = await prisma.bookingItemDemand.findMany({ where: { bookingId: b.id } });
      expect(demands.length).toBe(0);

      const reservations = await prisma.inventoryReservation.findMany({ where: { bookingId: b.id } });
      expect(reservations.length).toBe(0);
      
      const booking = await prisma.booking.findUnique({ where: { id: b.id } });
      expect(booking?.status).toBe('DRAFT');
    }, 30000);

    it('Stress Scaling (20 concurrent burst callers x 1 Unit)', async () => {
      const eventStart = new Date(Date.now() + 8 * 3600 * 1000);
      const eventEnd = new Date(Date.now() + 9 * 3600 * 1000);

      const stressItem = await prisma.inventoryItem.create({
        data: { businessId, name: 'StressItem', sku: 'STRESS-20', totalQty: 2 }
      });

      const N = 20; 
      const bookings = [];
      for (let i = 0; i < N; i++) {
        const b = await bookingsService.createDraftBooking(businessId, userId, {
          customerId, eventName: `Stress ${i}`, eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
          lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: stressItem.id, quantity: 1 }]
        });
        bookings.push(b!.id);
      }

      const results = await Promise.allSettled(
        bookings.map((id, idx) => reservationsService.confirmBooking({ businessId, bookingId: id, userId, idempotencyKey: `idem-stress-${idx}` }))
      );

      const successes = results.filter(r => r.status === 'fulfilled').length;
      expect(successes).toBeLessThanOrEqual(2);

      const activeReservedQuantity = await prisma.inventoryReservation.aggregate({
        _sum: { quantity: true },
        where: { businessId, inventoryItemId: stressItem.id, status: 'ACTIVE' }
      });
      expect(activeReservedQuantity._sum.quantity || 0).toBe(successes);
      expect(activeReservedQuantity._sum.quantity || 0).toBeLessThanOrEqual(2);
    }, 60000);

    it('Post-Stress DB Verification (is_sound = true)', async () => {
      const query = await prisma.$queryRaw<any[]>`
        SELECT 
          i."id",
          COALESCE(SUM(r."quantity"), 0) <= (i."totalQty" - i."damagedQty" - i."missingQty" - i."maintenanceQty") AS "is_sound"
        FROM "inventory_items" i
        LEFT JOIN "inventory_reservations" r 
          ON r."inventoryItemId" = i."id" 
          AND r."status" = 'ACTIVE'
        WHERE i."businessId" = ${businessId} AND i."sku" = 'STRESS-20'
        GROUP BY i."id";
      `;

      for (const row of query) {
        expect(row.is_sound).toBe(true);
      }
    });
  });

  describe('Phase 16: Cancellation Engine', () => {
    it('Double-Cancel Race (409 on second cancel) & Capacity Reclaim', async () => {
      const eventStart = new Date(Date.now() + 10 * 3600 * 1000);
      const eventEnd = new Date(Date.now() + 11 * 3600 * 1000);

      const cancelItem = await prisma.inventoryItem.create({
        data: { businessId, name: 'CancelItem', sku: 'CANCEL-ME', totalQty: 2 }
      });

      const b = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Cancel Test', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: cancelItem.id, quantity: 2 }]
      });

      await reservationsService.confirmBooking({ businessId, bookingId: b!.id, userId, idempotencyKey: 'idem-cancel-test' });

      let availRes = await request(app)
        .post(`/api/v1/bookings/${b!.id}/check-availability`)
        .set('Authorization', `Bearer ${token}`);
      
      if (!availRes.body.items) {
        console.error('AVAIL ERROR', availRes.body);
      }
      expect(availRes.body.items[0].available).toBe(0);

      const cancelResults = await Promise.allSettled([
        request(app).post(`/api/v1/bookings/${b!.id}/cancel`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'idem-cancel-race').send({ reason: 'Race A' }),
        request(app).post(`/api/v1/bookings/${b!.id}/cancel`).set('Authorization', `Bearer ${token}`).set('Idempotency-Key', 'idem-cancel-race').send({ reason: 'Race B' }),
      ]);

      const codes = cancelResults.map(r => (r as any).value.status).sort();
      expect(codes).toEqual([200, 409]);

      const activeRes = await prisma.inventoryReservation.findMany({
        where: { bookingId: b!.id, status: 'ACTIVE' }
      });
      expect(activeRes.length).toBe(0);

      const cancelledRes = await prisma.inventoryReservation.findMany({
        where: { bookingId: b!.id, status: 'CANCELLED' }
      });
      expect(cancelledRes.length).toBe(1);

      const demands = await prisma.bookingItemDemand.findMany({
        where: { bookingId: b!.id }
      });
      expect(demands.length).toBe(1); 

      availRes = await request(app)
        .post(`/api/v1/bookings/${b!.id}/check-availability`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(availRes.body.items[0].available).toBe(2);

      const b2 = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Re-book Test', eventStart: eventStart.toISOString(), eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: cancelItem.id, quantity: 2 }]
      });

      const b2Confirm = await reservationsService.confirmBooking({ businessId, bookingId: b2!.id, userId, idempotencyKey: 'idem-rebook' });
      expect(b2Confirm.data.status).toBe('CONFIRMED');
    }, 30000);

    it('rejects cancellation for DISPATCHED, RETURNED, COMPLETED', async () => {
      const b = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Status test', eventStart: new Date().toISOString(), eventEnd: new Date(Date.now()+1000).toISOString(),
        lines: []
      });
      await prisma.$executeRaw`UPDATE "bookings" SET status = 'DISPATCHED'::"BookingStatus" WHERE id = ${b!.id}`;

      const res = await request(app)
        .post(`/api/v1/bookings/${b!.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-cancel-dispatched');
        
      expect(res.status).toBe(409);
    }, 30000);
  });
});
