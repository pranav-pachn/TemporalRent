import { Prisma, BookingStatus, ReservationStatus, AuditAction } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { CreateBookingInput } from './bookings.types';
import { PackageExpansionService } from '../package-expansion/package-expansion.service';
import { BOOKING_TRANSITIONS } from '@temporalrent/shared';
import { ApiError } from '../../lib/errors';
import { ReservationsRepository } from '../reservations/reservations.repository';
import { AvailabilityRepository, CandidateItemWindow } from '../availability/availability.repository';
import { BookingLineInput } from '../package-expansion/package-expansion.types';

export class BookingsService {
  async createDraftBooking(businessId: string, createdByUserId: string, input: CreateBookingInput) {
    const eventStart = new Date(input.eventStart);
    const eventEnd = new Date(input.eventEnd);

    // Expand lines to calculate BookingItemDemand
    const demandsMap = new Map<string, number>();

    const packageExpansionService = new PackageExpansionService();

    for (const line of input.lines) {
      if (line.type === 'PACKAGE' && line.packageVersionId) {
        const expanded = await packageExpansionService.expandPackage(line.packageVersionId, line.quantity, businessId);
        for (const item of expanded) {
          const current = demandsMap.get(item.inventoryItemId) || 0;
          demandsMap.set(item.inventoryItemId, current + item.quantity);
        }
      } else if (line.type === 'INVENTORY_ITEM' && line.inventoryItemId) {
        const current = demandsMap.get(line.inventoryItemId) || 0;
        demandsMap.set(line.inventoryItemId, current + line.quantity);
      }
    }

    return prisma.$transaction(async (tx) => {
      const bookingId = crypto.randomUUID();
      
      await tx.$executeRaw`
        INSERT INTO "bookings" (
          "id", "businessId", "customerId", "eventName", 
          "eventStart", "eventEnd", "location", "notes", 
          "status", "period", "createdByUserId", "createdAt", "updatedAt"
        ) VALUES (
          ${bookingId}, ${businessId}, ${input.customerId}, ${input.eventName},
          ${eventStart}::timestamptz, ${eventEnd}::timestamptz, ${input.location || null}, ${input.notes || null},
          'DRAFT', tstzrange(${eventStart}::timestamptz, ${eventEnd}::timestamptz, '[)'),
          ${createdByUserId}, NOW(), NOW()
        )
      `;

      for (const line of input.lines) {
        await tx.bookingLine.create({
          data: {
            bookingId,
            type: line.type,
            packageVersionId: line.packageVersionId,
            inventoryItemId: line.inventoryItemId,
            quantity: line.quantity,
          }
        });
      }

      for (const [inventoryItemId, quantityDemanded] of demandsMap.entries()) {
        await tx.bookingItemDemand.create({
          data: {
            businessId,
            bookingId,
            inventoryItemId,
            quantityDemanded,
          }
        });
      }

      return tx.booking.findUnique({
        where: { id: bookingId },
        include: { bookingLines: true, bookingItemDemands: true }
      });
    }, { maxWait: 30000, timeout: 30000 });
  }

  async transitionBooking(businessId: string, bookingId: string, userId: string, targetStatus: BookingStatus) {
    if (targetStatus === BookingStatus.CANCELLED) {
      return this.cancelBooking(businessId, bookingId, userId);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Lock the booking row
      const bookings = await tx.$queryRaw<any[]>`
        SELECT "id", "status" FROM "bookings"
        WHERE "id" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (bookings.length === 0) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      const booking = bookings[0];

      // Idempotent terminal state or target status handling
      if (booking.status === targetStatus) {
        // We reject same-state transitions strictly except where historically allowed, but for 
        // CANCELLED/COMPLETED etc we throw 409. 
      }

      const currentStatus = booking.status as any;
      const allowed = BOOKING_TRANSITIONS[currentStatus as import('@temporalrent/shared').BookingStatus] || [];
      if (!allowed.includes(targetStatus as any)) {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Cannot transition booking from ' + currentStatus + ' to ' + targetStatus);
      }

      // 2. Update booking status
      await tx.$executeRaw`
        UPDATE "bookings"
        SET "status" = ${targetStatus}::"BookingStatus", "updatedAt" = NOW()
        WHERE "id" = ${bookingId}
      `;

      // 4. Audit Event
      await tx.auditEvent.create({
        data: {
          businessId,
          userId,
          action: 'UPDATE',
          tableName: 'bookings',
          recordId: bookingId,
          after: { status: targetStatus }
        }
      });

      return { id: bookingId, status: targetStatus };
    }, { maxWait: 30000, timeout: 30000 });
  }

  async cancelBooking(businessId: string, bookingId: string, userId: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock the booking row
      const bookings = await tx.$queryRaw<any[]>`
        SELECT "id", "status" FROM "bookings"
        WHERE "id" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (bookings.length === 0) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      const booking = bookings[0];

      // 2. Transition Validation
      const cancellableStatuses = ['DRAFT', 'QUOTED', 'CONFIRMED'];
      if (!cancellableStatuses.includes(booking.status)) {
        throw new ApiError(
          409, 
          'INVALID_STATUS_TRANSITION', 
          `Cannot cancel booking with status ${booking.status}`
        );
      }

      // 3. Release Reservations
      await tx.$executeRaw`
        UPDATE "inventory_reservations"
        SET "status" = 'CANCELLED'::"ReservationStatus", "updatedAt" = NOW()
        WHERE "bookingId" = ${bookingId} AND "status" = 'ACTIVE'::"ReservationStatus"
      `;

      // 4. Preserve Demand (No-op)

      // 5. Mutate Booking
      await tx.$executeRaw`
        UPDATE "bookings"
        SET "status" = 'CANCELLED'::"BookingStatus", "updatedAt" = NOW()
        WHERE "id" = ${bookingId}
      `;

      // 6. Audit Event
      await tx.auditEvent.create({
        data: {
          businessId,
          userId,
          action: 'UPDATE',
          tableName: 'bookings',
          recordId: bookingId,
          after: { 
            status: 'CANCELLED',
            reason: reason || 'User requested cancellation'
          }
        }
      });

      return { id: bookingId, status: 'CANCELLED' };
    }, { maxWait: 30000, timeout: 30000 });
  }

  async getBookings(businessId: string, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      prisma.booking.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: { customer: true }
      }),
      prisma.booking.count({ where: { businessId } })
    ]);

    return { data, total, page, limit };
  }

  async rescheduleBooking(businessId: string, bookingId: string, userId: string, input: { eventStart: string, eventEnd: string }) {
    const reservationsRepo = new ReservationsRepository();
    const availabilityRepo = new AvailabilityRepository();
    const expansionService = new PackageExpansionService();
    
    let finalResponseBody: any = null;

    finalResponseBody = await prisma.$transaction(async (tx) => {
      // 1. Lock the booking row
      const bookings = await tx.$queryRaw<any[]>`
        SELECT "id", "status", "eventStart", "eventEnd"
        FROM "bookings"
        WHERE "id" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (bookings.length === 0) throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
      const booking = bookings[0];

      if (booking.status === 'DRAFT' || booking.status === 'QUOTED') {
        throw new ApiError(400, 'INVALID_BOOKING_STATUS', 'Booking is DRAFT/QUOTED. Update dates via metadata patch; no reservations exist.');
      }

      if (booking.status !== 'CONFIRMED') {
        throw new ApiError(409, 'INVALID_STATUS_TRANSITION', 'Cannot reschedule booking with status ' + booking.status);
      }

      // 2. Fetch current active reservations
      const oldReservations = await tx.inventoryReservation.findMany({
        where: { bookingId, status: 'ACTIVE' }
      });

      // 3. Expand new demand & resolve candidate windows
      const bookingLines = await tx.bookingLine.findMany({ where: { bookingId } });
      const mappedLines: BookingLineInput[] = bookingLines.map((line) => ({
        type: line.type as any,
        packageVersionId: line.packageVersionId || undefined,
        inventoryItemId: line.inventoryItemId || undefined,
        quantity: line.quantity,
      }));

      const demands = await expansionService.aggregateDemand(mappedLines, businessId);
      const newDemandItems = demands.map(d => ({ inventoryItemId: d.inventoryItemId, quantity: d.quantity }));
      
      // 4. Deadlock-free multi-item locking
      const affectedItemIds = Array.from(new Set([
        ...oldReservations.map(r => r.inventoryItemId),
        ...newDemandItems.map(d => d.inventoryItemId)
      ])).sort();

      const lockedRows = await reservationsRepo.lockInventoryItems(tx, businessId, affectedItemIds);
      const lockedMap = new Map(lockedRows.map(r => [r.id, r]));

      const baseStart = new Date(input.eventStart);
      const baseEnd = new Date(input.eventEnd);
      const candidates: CandidateItemWindow[] = [];

      // Fetch buffer settings for all demand items
      const itemIds = newDemandItems.map(d => d.inventoryItemId);
      if (itemIds.length > 0) {
        const itemsData = await tx.inventoryItem.findMany({
          where: { id: { in: itemIds }, businessId },
          include: { category: true, business: true },
        });

        for (const item of itemsData) {
          const bufferBefore = item.bufferBeforeMinutes ?? item.category?.bufferBeforeMinutes ?? item.business.defaultBufferBeforeMinutes;
          const bufferAfter = item.bufferAfterMinutes ?? item.category?.bufferAfterMinutes ?? item.business.defaultBufferAfterMinutes;

          candidates.push({
            inventoryItemId: item.id,
            effectiveStart: new Date(baseStart.getTime() - bufferBefore * 60000),
            effectiveEnd: new Date(baseEnd.getTime() + bufferAfter * 60000),
          });
        }
      }

      // 5. Check availability excluding self-conflict
      const reservedResults = await reservationsRepo.findOverlappingReservationsTx(tx, businessId, candidates, bookingId);
      const reservedMap = new Map(reservedResults.map(r => [r.inventoryItemId, r.reservedQuantity]));
      
      let shortageCandidates: CandidateItemWindow[] = [];
      let inventoryConflictItems: any[] = [];

      for (const candidate of candidates) {
        const demand = demands.find(d => d.inventoryItemId === candidate.inventoryItemId)!;
        const lockedItem = lockedMap.get(candidate.inventoryItemId);
        
        const usable = lockedItem.totalQty - (lockedItem.damagedQty + lockedItem.missingQty + lockedItem.maintenanceQty);
        const reserved = reservedMap.get(candidate.inventoryItemId) || 0;
        const available = Math.max(0, usable - reserved);

        if (available < demand.quantity) {
          shortageCandidates.push(candidate);
          inventoryConflictItems.push({
            inventoryItemId: candidate.inventoryItemId,
            required: demand.quantity,
            usable,
            reserved,
            available,
            shortage: demand.quantity - available,
          });
        }
      }

      if (inventoryConflictItems.length > 0) {
        const apiError: any = new ApiError(409, 'INVENTORY_CONFLICT', 'Booking cannot be rescheduled due to inventory shortages.');
        const conflictDetails = await availabilityRepo.findOverlappingReservationDetails(businessId, shortageCandidates, bookingId);
        apiError.items = inventoryConflictItems;
        apiError.conflicts = conflictDetails.map(detail => ({
          reservationId: detail.id,
          bookingId: detail.bookingId,
          eventName: detail.eventName,
          quantity: detail.quantity,
          period: {
            start: detail.effectiveStart.toISOString(),
            end: detail.effectiveEnd.toISOString(),
          }
        }));
        throw apiError;
      }

      // 6. Atomic Reservation Swap
      await tx.$executeRaw`
        UPDATE "inventory_reservations"
        SET "status" = 'CANCELLED'::"ReservationStatus", "updatedAt" = NOW()
        WHERE "bookingId" = ${bookingId} AND "status" = 'ACTIVE'::"ReservationStatus"
      `;

      // 7. Persist Booking & Demand Updates
      await tx.bookingItemDemand.deleteMany({ where: { bookingId } });

      for (const candidate of candidates) {
        const demand = demands.find(d => d.inventoryItemId === candidate.inventoryItemId)!;
        
        const newDemand = await tx.bookingItemDemand.create({
          data: {
            businessId,
            bookingId,
            inventoryItemId: candidate.inventoryItemId,
            quantityDemanded: demand.quantity,
            quantity: demand.quantity,
          }
        });

        await tx.$executeRaw`
          INSERT INTO "inventory_reservations" (
            "id", "businessId", "inventoryItemId", "bookingId", "bookingItemDemandId", "quantity", "period", "status", "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text,
            ${businessId},
            ${candidate.inventoryItemId},
            ${bookingId},
            ${newDemand.id},
            ${demand.quantity},
            tstzrange(
              ${candidate.effectiveStart.toISOString()}::timestamptz,
              ${candidate.effectiveEnd.toISOString()}::timestamptz,
              '[)'
            ),
            'ACTIVE',
            NOW(),
            NOW()
          )
        `;
      }

      await tx.$executeRaw`
        UPDATE "bookings"
        SET "eventStart" = ${baseStart}::timestamptz,
            "eventEnd" = ${baseEnd}::timestamptz,
            "period" = tstzrange(${baseStart}::timestamptz, ${baseEnd}::timestamptz, '[)'),
            "updatedAt" = NOW()
        WHERE "id" = ${bookingId}
      `;

      // 8. Record Audit
      await tx.auditEvent.create({
        data: {
          businessId,
          userId,
          action: 'UPDATE',
          tableName: 'bookings',
          recordId: bookingId,
          after: { 
            status: 'CONFIRMED',
            eventStart: baseStart.toISOString(),
            eventEnd: baseEnd.toISOString()
          }
        }
      });

      return { id: bookingId, status: 'CONFIRMED' };
    }, { maxWait: 30000, timeout: 30000 });

    return { statusCode: 200, body: finalResponseBody };
  }
}
