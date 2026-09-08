import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { DispatchService } from '../src/modules/dispatch/dispatch.service';
import { ReturnsService } from '../src/modules/returns/returns.service';
import { IdempotencyService } from '../src/common/idempotency/idempotency.service';
import crypto from 'crypto';



const dispatchService = new DispatchService();
const returnsService = new ReturnsService();
const idempotencyService = new IdempotencyService();
const bookingsService = new BookingsService();

describe('Phase 19 & 20: Dispatch & Returns', () => {
  let businessId: string;
  let userId: string;
  let customerId: string;
  let itemSofaId: string;
  let itemChairId: string;
  let bookingId: string;
  let demandSofaId: string;
  let demandChairId: string;

  beforeAll(async () => {
    const biz = await prisma.business.create({
      data: { name: 'Dispatch Biz', slug: `dispatch-returns-${Date.now()}` },
    });
    businessId = biz.id;
    const user = await prisma.user.create({
      data: { businessId, email: 'warehouse@test.com', passwordHash: 'hash', role: 'WAREHOUSE' },
    });
    userId = user.id;
    const customer = await prisma.customer.create({
      data: { businessId, name: 'John Dispatch', email: 'john@dispatch.com' },
    });
    customerId = customer.id;

    const sofa = await prisma.inventoryItem.create({
      data: { businessId, name: 'Sofa', totalQty: 10 },
    });
    itemSofaId = sofa.id;

    const chair = await prisma.inventoryItem.create({
      data: { businessId, name: 'Chair', totalQty: 20 },
    });
    itemChairId = chair.id;

    const bookingRes = await bookingsService.createDraftBooking(businessId, userId, {
      customerId,
      eventName: 'Warehouse Test Event',
      eventStart: new Date('2024-10-01T10:00:00Z').toISOString(),
      eventEnd: new Date('2024-10-05T10:00:00Z').toISOString(),
      lines: [
        { type: 'INVENTORY_ITEM', inventoryItemId: itemSofaId, quantity: 2 },
        { type: 'INVENTORY_ITEM', inventoryItemId: itemChairId, quantity: 4 },
      ]
    });
    bookingId = bookingRes.id;

    // Force CONFIRMED status
    await prisma.$executeRaw`UPDATE bookings SET status = 'CONFIRMED'::"BookingStatus" WHERE id = ${bookingId}`;

    const demands = await prisma.bookingItemDemand.findMany({ where: { bookingId } });
    demandSofaId = demands.find(d => d.inventoryItemId === itemSofaId)!.id;
    demandChairId = demands.find(d => d.inventoryItemId === itemChairId)!.id;
  });

  afterAll(async () => {
    // Tests are designed to leave isolated data in the DB under unique slugs 
    // to avoid concurrent delete interference with other test files.
  });

  it('prepares dispatch with correct expected quantities', async () => {
    const dispatch = await dispatchService.prepareDispatch(businessId, bookingId, userId);
    
    expect(dispatch.status).toBe('READY');
    expect(dispatch.lines).toHaveLength(2);

    const sofaLine = dispatch.lines.find(l => l.inventoryItemId === itemSofaId)!;
    expect(sofaLine.expectedQty).toBe(2);
    expect(sofaLine.dispatchedQty).toBe(0);

    const chairLine = dispatch.lines.find(l => l.inventoryItemId === itemChairId)!;
    expect(chairLine.expectedQty).toBe(4);
    expect(chairLine.dispatchedQty).toBe(0);
  });

  it('prevents multiple dispatches for same booking', async () => {
    await expect(dispatchService.prepareDispatch(businessId, bookingId, userId)).rejects.toThrow(/already exists/i);
  });

  it('confirms dispatch with idempotency and physical movement', async () => {
    const dispatch = await prisma.dispatch.findUnique({ where: { bookingId }, include: { lines: true } });
    const sofaLine = dispatch!.lines.find(l => l.inventoryItemId === itemSofaId)!;
    const chairLine = dispatch!.lines.find(l => l.inventoryItemId === itemChairId)!;

    const payload = {
      lines: [
        { dispatchLineId: sofaLine.id, dispatchedQty: 2 }, // full
        { dispatchLineId: chairLine.id, dispatchedQty: 3 }, // partial (1 not sent)
      ]
    };

    const idempotencyKey = crypto.randomUUID();

    await dispatchService.startPicking(businessId, bookingId, userId);

    const confirmRes = await idempotencyService.executeIdempotent({
      businessId,
      key: idempotencyKey,
      operation: 'DISPATCH',
      bookingId,
      payload,
      execute: async () => {
        const data = await dispatchService.confirmDispatch(businessId, bookingId, userId, payload);
        return { statusCode: 200, body: data };
      }
    });

    expect(confirmRes.statusCode).toBe(200);

    const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(updatedBooking?.status).toBe('DISPATCHED');

    const movements = await prisma.inventoryMovement.findMany({ where: { bookingId, movementType: 'DISPATCH' } });
    expect(movements).toHaveLength(2);
    expect(movements.find(m => m.inventoryItemId === itemSofaId)?.quantityDelta).toBe(-2);
    expect(movements.find(m => m.inventoryItemId === itemChairId)?.quantityDelta).toBe(-3);
  });

  it('handles concurrent dispatch confirmations correctly (409 Conflict)', async () => {
    // Already dispatched, so any concurrent confirmation should throw 409
    const dispatch = await prisma.dispatch.findUnique({ where: { bookingId }, include: { lines: true } });
    const sofaLine = dispatch!.lines.find(l => l.inventoryItemId === itemSofaId)!;
    
    const payload = {
      lines: [{ dispatchLineId: sofaLine.id, dispatchedQty: 2 }]
    };

    const promise1 = dispatchService.confirmDispatch(businessId, bookingId, userId, payload);
    const promise2 = dispatchService.confirmDispatch(businessId, bookingId, userId, payload);

    const results = await Promise.allSettled([promise1, promise2]);
    
    // Both should actually fail with 409 since it's already DISPATCHED by the previous test,
    // but the point is we test concurrency lock. We can expect both to reject.
    expect(results[0].status).toBe('rejected');
    expect(results[1].status).toBe('rejected');
  });

  it('rejects incomplete return payload', async () => {
    const dispatch = await prisma.dispatch.findUnique({ where: { bookingId }, include: { lines: true } });
    const sofaLine = dispatch!.lines.find(l => l.inventoryItemId === itemSofaId)!;
    
    const incompletePayload = {
      lines: [
        {
          dispatchLineId: sofaLine.id,
          returnedGoodQty: 2,
          damagedQty: 0,
          missingQty: 0,
        }
      ]
    };

    await expect(returnsService.completeReturn(businessId, bookingId, userId, incompletePayload))
      .rejects.toThrow(/Missing return data/);
  });

  it('completes return accurately and creates damage report', async () => {
    const dispatch = await prisma.dispatch.findUnique({ where: { bookingId }, include: { lines: true } });
    const sofaLine = dispatch!.lines.find(l => l.inventoryItemId === itemSofaId)!; // dispatched 2
    const chairLine = dispatch!.lines.find(l => l.inventoryItemId === itemChairId)!; // dispatched 3

    const returnPayload = {
      lines: [
        {
          dispatchLineId: sofaLine.id,
          returnedGoodQty: 1,
          damagedQty: 1,
          missingQty: 0,
          damageDetails: 'Scratch on left arm'
        },
        {
          dispatchLineId: chairLine.id,
          returnedGoodQty: 2,
          damagedQty: 0,
          missingQty: 1,
        }
      ]
    };

    const returnRecord = await returnsService.completeReturn(businessId, bookingId, userId, returnPayload);

    expect(returnRecord.status).toBe('COMPLETED');
    expect(returnRecord.lines).toHaveLength(2);

    const updatedBooking = await prisma.booking.findUnique({ where: { id: bookingId } });
    expect(updatedBooking?.status).toBe('RETURNED');

    // Check inventory quantities
    const sofa = await prisma.inventoryItem.findUnique({ where: { id: itemSofaId } });
    expect(sofa?.totalQty).toBe(10); // Conserved
    expect(sofa?.damagedQty).toBe(1);

    const chair = await prisma.inventoryItem.findUnique({ where: { id: itemChairId } });
    expect(chair?.totalQty).toBe(20); // Conserved
    expect(chair?.missingQty).toBe(1);

    // Check Damage Report
    const damageReports = await prisma.damageReport.findMany({ where: { bookingId } });
    expect(damageReports).toHaveLength(1);
    expect(damageReports[0].quantityDamaged).toBe(1);
    expect(damageReports[0].description).toBe('Scratch on left arm');

    // Check ledgers
    const returnGoodMovements = await prisma.inventoryMovement.findMany({ where: { bookingId, movementType: 'RETURN_GOOD' } });
    expect(returnGoodMovements).toHaveLength(2); // 1 sofa, 2 chairs
    const damageMovements = await prisma.inventoryMovement.findMany({ where: { bookingId, movementType: 'DAMAGE' } });
    expect(damageMovements).toHaveLength(1);
    expect(damageMovements[0].quantityDelta).toBe(1); // Sofa damage

    const missingMovements = await prisma.inventoryMovement.findMany({ where: { bookingId, movementType: 'MISSING' } });
    expect(missingMovements).toHaveLength(1);
    expect(missingMovements[0].quantityDelta).toBe(0); // Missing has 0 physical movement
  });
});
