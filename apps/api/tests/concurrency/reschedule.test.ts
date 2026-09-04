import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { BookingsService } from '../../src/modules/bookings/bookings.service';
import { ReservationsService } from '../../src/modules/reservations/reservations.service';
import request from 'supertest';
import { app } from '../../src/app';
import { signAccessToken } from '../../src/lib/jwt';

describe('Phases 17 & 18: Transactional Rescheduling & Idempotency', () => {
  let businessId: string;
  let userId: string;
  let token: string;
  let customerId: string;
  let itemSpeakerId: string;
  let itemMicId: string;

  const bookingsService = new BookingsService();
  const reservationsService = new ReservationsService();

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: {
        name: 'Phase 17 Reschedule',
        slug: 'p17-reschedule-' + Date.now(),
        plan: 'PRO',
        defaultBufferBeforeMinutes: 0,
        defaultBufferAfterMinutes: 0,
      }
    });
    businessId = biz.id;

    const user = await prisma.user.create({
      data: {
        email: 'reschedule-' + Date.now() + '@test.com',
        passwordHash: 'dummy',
        role: 'ADMIN',
        businessId,
      }
    });
    userId = user.id;
    token = await signAccessToken({ userId: user.id, businessId, role: 'ADMIN' });

    const customer = await prisma.customer.create({
      data: { businessId, name: 'Reschedule Tester' }
    });
    customerId = customer.id;

    const cat = await prisma.category.create({ data: { businessId, name: 'Audio' } });

    const speaker = await prisma.inventoryItem.create({
      data: { businessId, categoryId: cat.id, name: 'Speaker', sku: 'SPK-RESCHED', totalQty: 2 }
    });
    itemSpeakerId = speaker.id;

    const mic = await prisma.inventoryItem.create({
      data: { businessId, categoryId: cat.id, name: 'Mic', sku: 'MIC-RESCHED', totalQty: 2 }
    });
    itemMicId = mic.id;
  });

  describe('Phase 17: Transactional Rescheduling', () => {
    it('Reschedule Race (2 Bookings competing for 1 remaining item)', async () => {
      // Setup: 2 units total. We book 1 unit in Booking A, 1 unit in Booking B on Date 1.
      // Then we try to reschedule both A and B to Date 2, which already has 1 unit booked by C.
      // So on Date 2, only 1 unit is available.
      // When A and B concurrently reschedule to Date 2, one must succeed and one must fail.
      const date1Start = new Date();
      const date1End = new Date(Date.now() + 3600 * 1000);
      
      const date2Start = new Date(Date.now() + 24 * 3600 * 1000);
      const date2End = new Date(Date.now() + 25 * 3600 * 1000);

      const bA = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Book A Date 1', eventStart: date1Start.toISOString(), eventEnd: date1End.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemSpeakerId, quantity: 1 }]
      });

      const bB = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Book B Date 1', eventStart: date1Start.toISOString(), eventEnd: date1End.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemSpeakerId, quantity: 1 }]
      });

      const bC = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Book C Date 2', eventStart: date2Start.toISOString(), eventEnd: date2End.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemSpeakerId, quantity: 1 }]
      });

      // Confirm all 3 bookings initially
      await reservationsService.confirmBooking({ businessId, bookingId: bA!.id, userId, idempotencyKey: 'idem-conf-a' });
      await reservationsService.confirmBooking({ businessId, bookingId: bB!.id, userId, idempotencyKey: 'idem-conf-b' });
      await reservationsService.confirmBooking({ businessId, bookingId: bC!.id, userId, idempotencyKey: 'idem-conf-c' });

      // Now concurrently reschedule A and B to Date 2
      const resA = request(app).post(`/api/v1/bookings/${bA!.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-resched-a')
        .send({ eventStart: date2Start.toISOString(), eventEnd: date2End.toISOString() });

      const resB = request(app).post(`/api/v1/bookings/${bB!.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-resched-b')
        .send({ eventStart: date2Start.toISOString(), eventEnd: date2End.toISOString() });

      const results = await Promise.allSettled([resA, resB]);

      const codes = results.map(r => (r as any).value.status).sort();
      expect(codes).toEqual([200, 409]); // One succeeds, one fails due to INVENTORY_CONFLICT

      // Verify the failed one remains on Date 1
      const failedId = (results[0] as any).value.status === 409 ? bA!.id : bB!.id;
      const failedBooking = await prisma.booking.findUnique({ where: { id: failedId } });
      expect(failedBooking!.eventStart.getTime()).toBe(date1Start.getTime());
      
      const activeRes = await prisma.inventoryReservation.findMany({
        where: { bookingId: failedId, status: 'ACTIVE' }
      });
      expect(activeRes.length).toBe(1);

      // Verify the successful one is on Date 2
      const succId = (results[0] as any).value.status === 200 ? bA!.id : bB!.id;
      const succBooking = await prisma.booking.findUnique({ where: { id: succId } });
      expect(succBooking!.eventStart.getTime()).toBe(date2Start.getTime());
      
      const succRes = await prisma.inventoryReservation.findMany({
        where: { bookingId: succId, status: 'ACTIVE' }
      });
      expect(succRes.length).toBe(1);

      // Verify overall quantities on Date 2
      const activeSumDate2 = await prisma.inventoryReservation.aggregate({
        _sum: { quantity: true },
        where: { businessId, inventoryItemId: itemSpeakerId, status: 'ACTIVE', bookingId: { in: [bC!.id, succId] } }
      });
      expect(activeSumDate2._sum.quantity).toBe(2);
    }, 30000);

    it('Idempotency Replay (Hash & Operation mismatch)', async () => {
      const dateStart = new Date(Date.now() + 48 * 3600 * 1000);
      const dateEnd = new Date(Date.now() + 49 * 3600 * 1000);

      const b = await bookingsService.createDraftBooking(businessId, userId, {
        customerId, eventName: 'Idem Hash Test', eventStart: dateStart.toISOString(), eventEnd: dateEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemMicId, quantity: 1 }]
      });
      await reservationsService.confirmBooking({ businessId, bookingId: b!.id, userId, idempotencyKey: 'idem-hash-conf' });

      const newDateStart = new Date(Date.now() + 72 * 3600 * 1000);
      const newDateEnd = new Date(Date.now() + 73 * 3600 * 1000);

      const res1 = await request(app).post(`/api/v1/bookings/${b!.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-resched-hash')
        .send({ eventStart: newDateStart.toISOString(), eventEnd: newDateEnd.toISOString() });
      
      expect(res1.status).toBe(200);

      // Same key, different body -> should be 409
      const newDateStart2 = new Date(Date.now() + 96 * 3600 * 1000);
      const newDateEnd2 = new Date(Date.now() + 97 * 3600 * 1000);
      const res2 = await request(app).post(`/api/v1/bookings/${b!.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-resched-hash')
        .send({ eventStart: newDateStart2.toISOString(), eventEnd: newDateEnd2.toISOString() });
      
      expect(res2.status).toBe(409);
      expect(res2.body.code).toBe('IDEMPOTENCY_KEY_REUSE');

      // Same key, same body -> should replay 200
      const res3 = await request(app).post(`/api/v1/bookings/${b!.id}/reschedule`)
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', 'idem-resched-hash')
        .send({ eventStart: newDateStart.toISOString(), eventEnd: newDateEnd.toISOString() });

      expect(res3.status).toBe(200);
    }, 30000);
  });
});
