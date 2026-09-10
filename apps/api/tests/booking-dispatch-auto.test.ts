import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { DispatchService } from '../src/modules/dispatch/dispatch.service';

const bookingsService = new BookingsService();

describe('Booking Dispatch Auto-creation & Atomicity', () => {
  let businessId: string;
  let userId: string;
  let customerId: string;
  let itemSofaId: string;

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: { name: 'Auto Dispatch Biz', slug: `auto-dispatch-${Date.now()}` },
    });
    businessId = biz.id;
    const user = await prisma.user.create({
      data: { businessId, email: 'auto-warehouse@test.com', passwordHash: 'hash', role: 'WAREHOUSE' },
    });
    userId = user.id;
    const customer = await prisma.customer.create({
      data: { businessId, name: 'Auto John', email: 'autojohn@dispatch.com' },
    });
    customerId = customer.id;

    const sofa = await prisma.inventoryItem.create({
      data: { businessId, name: 'Sofa', totalQty: 10 },
    });
    itemSofaId = sofa.id;
  });

  afterAll(async () => {
    await prisma.dispatchLine.deleteMany({ where: { dispatch: { businessId } } });
    await prisma.dispatch.deleteMany({ where: { businessId } });
    await prisma.inventoryReservation.deleteMany({ where: { businessId } });
    await prisma.bookingItemDemand.deleteMany({ where: { businessId } });
    await prisma.bookingLine.deleteMany({ where: { booking: { businessId } } });
    await prisma.booking.deleteMany({ where: { businessId } });
    await prisma.inventoryItem.deleteMany({ where: { businessId } });
    await prisma.customer.deleteMany({ where: { businessId } });
    await prisma.user.deleteMany({ where: { businessId } });
    await prisma.business.deleteMany({ where: { id: businessId } });
  });

  it('creates READY dispatch when booking is confirmed', async () => {
    const bookingRes = await bookingsService.createDraftBooking(businessId, userId, {
      customerId,
      eventName: 'Auto Dispatch Event',
      eventStart: new Date('2024-11-01T10:00:00Z').toISOString(),
      eventEnd: new Date('2024-11-05T10:00:00Z').toISOString(),
      lines: [
        { type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 },
      ]
    });
    const bookingId = bookingRes.id!;

    // Confirm booking via QUOTED
    await bookingsService.transitionBooking(businessId, bookingId, userId, 'QUOTED');
    await bookingsService.transitionBooking(businessId, bookingId, userId, 'CONFIRMED');

    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    const dispatch = await prisma.dispatch.findFirst({ where: { bookingId }, include: { lines: true } });

    expect(booking?.status).toBe('CONFIRMED');
    expect(dispatch).not.toBeNull();
    expect(dispatch?.status).toBe('READY');
    expect(dispatch?.lines.length).toBe(1);
    expect(dispatch?.lines[0].expectedQty).toBe(2);
  });

  it('rolls back transaction if dispatch creation fails', async () => {
    const bookingRes = await bookingsService.createDraftBooking(businessId, userId, {
      customerId,
      eventName: 'Fail Dispatch Event',
      eventStart: new Date('2024-12-01T10:00:00Z').toISOString(),
      eventEnd: new Date('2024-12-05T10:00:00Z').toISOString(),
      lines: [
        { type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 },
      ]
    });
    const bookingId = bookingRes.id!;

    await bookingsService.transitionBooking(businessId, bookingId, userId, 'QUOTED');

    // Spy on DispatchService.prototype.prepareDispatchInTx to throw
    const spy = vi.spyOn(DispatchService.prototype, 'prepareDispatchInTx').mockRejectedValueOnce(new Error('Simulated Dispatch Failure'));

    await expect(
      bookingsService.transitionBooking(businessId, bookingId, userId, 'CONFIRMED')
    ).rejects.toThrow('Simulated Dispatch Failure');

    spy.mockRestore();

    // Verify rollback
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    const dispatch = await prisma.dispatch.findFirst({ where: { bookingId } });
    const reservations = await prisma.inventoryReservation.findMany({ where: { bookingId } });

    expect(booking?.status).toBe('QUOTED'); // Rolled back to previous state, not CONFIRMED
    expect(dispatch).toBeNull(); // No dispatch created
    expect(reservations.length).toBe(0); // No active reservations
  });
});
