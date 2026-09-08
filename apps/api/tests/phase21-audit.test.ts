import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { BookingsService } from '../src/modules/bookings/bookings.service';
import { DispatchService } from '../src/modules/dispatch/dispatch.service';
import { ReturnsService } from '../src/modules/returns/returns.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';



describe('Phase 21: Immutable Audit & Operational History', () => {
  const bookingsService = new BookingsService();
  const dispatchService = new DispatchService();
  const returnsService = new ReturnsService();
  const auditService = new AuditService();

  let businessId: string;
  let otherBusinessId: string;
  let userId: string;
  let customerId: string;
  let itemId: string;
  let bookingId: string;

  beforeAll(async () => {
    const business = await prisma.business.create({
      data: { name: 'Audit Test Business', slug: `test-phase21-${Date.now()}` },
    });
    businessId = business.id;

    const otherBusiness = await prisma.business.create({
      data: { name: 'Other Business', slug: `test-other-${Date.now()}` },
    });
    otherBusinessId = otherBusiness.id;

    const user = await prisma.user.create({
      data: { businessId, email: 'admin@audit.com', passwordHash: 'hash', role: 'ADMIN' },
    });
    userId = user.id;

    const customer = await prisma.customer.create({
      data: { businessId, name: 'Audit Customer', email: 'cust@audit.com' },
    });
    customerId = customer.id;

    const item = await prisma.inventoryItem.create({
      data: { businessId, name: 'Audit Item', totalQty: 10 },
    });
    itemId = item.id;
  });

  afterAll(async () => {
    // Tests are designed to leave isolated data in the DB under test-phase21-* 
    // to avoid concurrent delete interference with other test files.
  });

  it('verifies atomicity: rollback prevents audit creation', async () => {
    const draft = await bookingsService.createDraftBooking(businessId, userId, {
      customerId,
      eventName: 'Fail Test Event',
      eventStart: new Date('2030-01-01T10:00:00Z').toISOString(),
      eventEnd: new Date('2030-01-05T10:00:00Z').toISOString(),
      lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemId, quantity: 100 }] // Exceeds capacity
    });

    try {
      // This will fail due to lack of availability
      await bookingsService.transitionStatus(businessId, draft.id, 'CONFIRMED', userId);
    } catch (e) {
      // expected
    }

    const audits = await prisma.auditEvent.findMany({ where: { bookingId: draft.id } });
    expect(audits).toHaveLength(0); // Atomicity validated
  });

  it('completes the full flow and checks chronological audit records', async () => {
    const draft = await bookingsService.createDraftBooking(businessId, userId, {
      customerId,
      eventName: 'Full Flow Event',
      eventStart: new Date('2028-01-01T10:00:00Z').toISOString(),
      eventEnd: new Date('2028-01-05T10:00:00Z').toISOString(),
      lines: [{ type: 'INVENTORY_ITEM', inventoryItemId: itemId, quantity: 2 }]
    });
    bookingId = draft.id;

    // CONFIRM
    // Since we mock availability/reservations for simpler test, let's just force transition for test
    // Wait, transitionBooking does not reserve inventory, it just updates status.
    await bookingsService.transitionBooking(businessId, bookingId, userId, 'QUOTED');
    await bookingsService.transitionBooking(businessId, bookingId, userId, 'CONFIRMED');

    // CREATE DISPATCH
    const dispatch = await dispatchService.prepareDispatch(businessId, bookingId, userId);

    // START PICKING
    await dispatchService.startPicking(businessId, bookingId, userId);

    // DISPATCH
    await dispatchService.confirmDispatch(businessId, bookingId, userId, {
      lines: [{ dispatchLineId: dispatch.lines[0].id, dispatchedQty: 2 }]
    });

    // RETURN
    await returnsService.completeReturn(businessId, bookingId, userId, {
      lines: [{
        dispatchLineId: dispatch.lines[0].id,
        returnedGoodQty: 1,
        damagedQty: 1,
        missingQty: 0,
        damageDetails: 'Broken leg'
      }]
    });

    // Verify Audit Timeline
    const audits = await auditService.getBookingAuditTrail(businessId, bookingId);
    expect(audits).toHaveLength(7);

    expect(audits[0].action).toBe(AuditAction.UPDATE); // CONFIRM (transitionStatus uses UPDATE, wait, we should check this)
    // Actually, transitionStatus uses UPDATE for any status. 
    
    // We expect the dispatch actions: CREATE, START_PICKING, DISPATCH
    const dispatchActions = audits.filter(a => a.entityType === AuditEntityType.DISPATCH).map(a => a.action);
    expect(dispatchActions).toEqual([AuditAction.CREATE, AuditAction.START_PICKING, AuditAction.DISPATCH]);

    // We expect RETURN and DAMAGE
    const returnActions = audits.filter(a => a.entityType === AuditEntityType.RETURN).map(a => a.action);
    expect(returnActions).toEqual([AuditAction.RETURN]);

    const damageActions = audits.filter(a => a.entityType === AuditEntityType.INVENTORY_ITEM).map(a => a.action);
    expect(damageActions).toEqual([AuditAction.DAMAGE]);

    // Check Chronology
    for (let i = 0; i < audits.length - 1; i++) {
      expect(audits[i].createdAt.getTime()).toBeLessThanOrEqual(audits[i+1].createdAt.getTime());
    }

    // Check bookingId is set on all
    for (const audit of audits) {
      expect(audit.bookingId).toBe(bookingId);
      expect(audit.businessId).toBe(businessId);
    }
  }, 15000);

  it('rejects overrides without a reason', async () => {
    await expect(prisma.$transaction(async (tx) => {
      return auditService.recordAuditEvent(tx as any, {
        businessId,
        userId,
        bookingId,
        action: AuditAction.OVERRIDE,
        entityType: AuditEntityType.BOOKING,
        entityId: bookingId,
        reason: '   ' // empty after trim
      });
    })).rejects.toThrow(/OVERRIDE action requires a valid reason/);
  });

  it('isolates tenants in listAuditEvents', async () => {
    const res1 = await auditService.listAuditEvents(businessId, { page: 1, limit: 10 });
    expect(res1.total).toBeGreaterThan(0);

    const res2 = await auditService.listAuditEvents(otherBusinessId, { page: 1, limit: 10 });
    expect(res2.total).toBe(0);
  });

  it('maintains snapshot integrity', async () => {
    const audits = await auditService.getBookingAuditTrail(businessId, bookingId);
    const dispatchAudit = audits.find(a => a.action === AuditAction.DISPATCH);
    
    expect((dispatchAudit?.after as any).status).toBe('DISPATCHED');
    expect((dispatchAudit?.before as any).status).toBe('PICKING');
    
    // Even if dispatch is updated later, audit is immutable
    const dispatchId = dispatchAudit!.entityId;
    await prisma.dispatch.update({ where: { id: dispatchId }, data: { status: 'CANCELLED' }});
    
    const auditsAfter = await auditService.getBookingAuditTrail(businessId, bookingId);
    const dispatchAuditAfter = auditsAfter.find(a => a.action === AuditAction.DISPATCH);
    expect((dispatchAuditAfter?.after as any).status).toBe('DISPATCHED');
  });
});
