import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { ReservationsService } from '../src/modules/reservations/reservations.service';
import { BookingStatus } from '@temporalrent/shared';

describe('Phases 12-14: State Machine, Advisory, Concurrency', () => {
  let businessId: string;
  let userId: string;
  let inventoryItemId: string;
  let customerId: string;

  const bookingsService = new BookingsService();
  const reservationsService = new ReservationsService();

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: {
        name: 'Concurrency Test Business',
        slug: 'concurrency-test-' + Date.now(),
        defaultBufferBeforeMinutes: 0,
        defaultBufferAfterMinutes: 0,
      }
    });
    businessId = business.id;

    const user = await prisma.user.create({
      data: {
        email: 'admin-' + Date.now() + '@concurrency.com',
        passwordHash: 'dummy',
        role: 'ADMIN',
        businessId,
      }
    });
    userId = user.id;

    const category = await prisma.category.create({
      data: { businessId, name: 'Tents' }
    });

    const customer = await prisma.customer.create({
      data: {
        businessId,
        name: 'Test Customer',
        email: 'test' + Date.now() + '@customer.com',
      }
    });
    customerId = customer.id;

    const item = await prisma.inventoryItem.create({
      data: {
        businessId,
        categoryId: category.id,
        sku: 'ITEM-' + Date.now(),
        name: 'Test Tent',
        totalQty: 10,
      }
    });
    inventoryItemId = item.id;
  });

  describe('Phase 12: State Machine Transitions', () => {
    it('should transition through happy path', async () => {
      const eventStart = new Date();
      const eventEnd = new Date(Date.now() + 3600 * 1000);
      
      const draft = await bookingsService.createDraftBooking(businessId, userId, {
        customerId,
        eventName: 'Test Flow',
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        lines: [],
      });

      expect(draft?.status).toBe('DRAFT');

      await bookingsService.transitionBooking(businessId, draft!.id, userId, BookingStatus.QUOTED);
      let b = await prisma.booking.findUnique({ where: { id: draft!.id }});
      expect(b?.status).toBe('QUOTED');

      await bookingsService.transitionBooking(businessId, draft!.id, userId, BookingStatus.CONFIRMED);
      b = await prisma.booking.findUnique({ where: { id: draft!.id }});
      expect(b?.status).toBe('CONFIRMED');
    });

    it('should reject invalid transition', async () => {
      const eventStart = new Date();
      const eventEnd = new Date(Date.now() + 3600 * 1000);
      
      const draft = await bookingsService.createDraftBooking(businessId, userId, {
        customerId,
        eventName: 'Test Fail Flow',
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        lines: [],
      });

      await expect(
        bookingsService.transitionBooking(businessId, draft!.id, userId, BookingStatus.COMPLETED)
      ).rejects.toThrow(/Cannot transition booking/);
    });
  });

  describe('Phase 14: Transactional Engine & Idempotency Stress Test', () => {
    it('should handle 100 concurrent requests idempotently without double-booking', async () => {
      const eventStart = new Date();
      const eventEnd = new Date(Date.now() + 3600 * 1000);
      
      const draft = await bookingsService.createDraftBooking(businessId, userId, {
        customerId,
        eventName: 'Stress Test Booking',
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId, quantity: 5 }],
      });

      const idempotencyKey = 'idem-' + Date.now();

      const requests = Array.from({ length: 100 }).map(() =>
        reservationsService.confirmBooking({
          businessId,
          bookingId: draft!.id,
          userId,
          idempotencyKey,
        }).catch(e => e)
      );

      const results = await Promise.all(requests);

      const reservations = await prisma.inventoryReservation.findMany({
        where: { bookingId: draft!.id, status: 'ACTIVE' }
      });

      expect(reservations.length).toBe(1);
      expect(reservations[0].quantity).toBe(5);

      const finalBooking = await prisma.booking.findUnique({ where: { id: draft!.id }});
      expect(finalBooking?.status).toBe('CONFIRMED');
    }, 15000);

    it('should correctly rollback and report conflict on overbooking', async () => {
      const eventStart = new Date();
      const eventEnd = new Date(Date.now() + 3600 * 1000);
      
      const draft = await bookingsService.createDraftBooking(businessId, userId, {
        customerId,
        eventName: 'Overbooking Test',
        eventStart: eventStart.toISOString(),
        eventEnd: eventEnd.toISOString(),
        lines: [{ type: 'INVENTORY_ITEM', inventoryItemId, quantity: 15 }],
      });

      try {
        await reservationsService.confirmBooking({
          businessId,
          bookingId: draft!.id,
          userId,
          idempotencyKey: 'idem-over-' + Date.now(),
        });
        expect.unreachable('Should have thrown an error');
      } catch (error: any) {
        expect(error.code).toBe('INVENTORY_CONFLICT');
        expect(error.items).toBeDefined();
        expect(error.items.length).toBe(1);
        expect(error.items[0].shortage).toBe(10); // 15 requested - 5 available (since previous test consumed 5)
        expect(error.conflicts).toBeDefined();
      }
    });
  });
});
