import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ConfirmBookingInput } from './reservations.types';
import { ReservationsRepository } from './reservations.repository';
import { AvailabilityRepository, CandidateItemWindow } from '../availability/availability.repository';
import { PackageExpansionService } from '../package-expansion/package-expansion.service';
import { BookingLineInput } from '../package-expansion/package-expansion.types';
import { ApiError } from '../../lib/errors';

export class ReservationsService {
  private reservationsRepo = new ReservationsRepository();
  private availabilityRepo = new AvailabilityRepository();
  private expansionService = new PackageExpansionService();

  async confirmBooking(input: ConfirmBookingInput) {
    const { businessId, bookingId, userId, idempotencyKey } = input;

    let shortageCandidates: CandidateItemWindow[] = [];
    let inventoryConflictItems: any[] = [];
    let transactionError: any = null;
    let finalResponseBody: any = null;

    try {
      finalResponseBody = await prisma.$transaction(
        async (tx) => {
          const bookings = await tx.$queryRaw<any[]>`
            SELECT "id", "status", "eventStart", "eventEnd" 
            FROM "bookings" 
            WHERE "id" = ${bookingId} AND "businessId" = ${businessId} 
            FOR UPDATE
          `;

          if (bookings.length === 0) {
            throw new ApiError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
          }
          const booking = bookings[0];

          if (booking.status !== 'DRAFT' && booking.status !== 'QUOTED') {
            throw new ApiError(409, 'INVALID_STATE_TRANSITION', 'Booking is not in DRAFT or QUOTED status');
          }

          const bookingLines = await tx.bookingLine.findMany({
            where: { bookingId },
          });

          const mappedLines: BookingLineInput[] = bookingLines.map((line) => ({
            type: line.type as any,
            packageVersionId: line.packageVersionId || undefined,
            inventoryItemId: line.inventoryItemId || undefined,
            quantity: line.quantity,
          }));

          const demands = await this.expansionService.aggregateDemand(mappedLines, businessId);
          if (demands.length === 0) {
            await tx.$executeRaw`
              UPDATE "bookings"
              SET "status" = 'CONFIRMED'::"BookingStatus", "updatedAt" = NOW()
              WHERE "id" = ${bookingId}
            `;
            return { data: { id: bookingId, status: 'CONFIRMED' } };
          }

          const itemIds = demands.map((d) => d.inventoryItemId);

          const itemsData = await tx.inventoryItem.findMany({
            where: { id: { in: itemIds }, businessId },
            include: { category: true, business: true },
          });

          const baseStart = new Date(booking.eventStart);
          const baseEnd = new Date(booking.eventEnd);
          const candidates: CandidateItemWindow[] = [];
          
          for (const item of itemsData) {
            const bufferBefore =
              item.bufferBeforeMinutes ??
              item.category?.bufferBeforeMinutes ??
              item.business.defaultBufferBeforeMinutes;

            const bufferAfter =
              item.bufferAfterMinutes ??
              item.category?.bufferAfterMinutes ??
              item.business.defaultBufferAfterMinutes;

            candidates.push({
              inventoryItemId: item.id,
              effectiveStart: new Date(baseStart.getTime() - bufferBefore * 60000),
              effectiveEnd: new Date(baseEnd.getTime() + bufferAfter * 60000),
            });
          }

          const lockedRows = await this.reservationsRepo.lockInventoryItems(tx, businessId, itemIds);
          const lockedMap = new Map(lockedRows.map(r => [r.id, r]));

          const reservedResults = await this.reservationsRepo.findOverlappingReservationsTx(tx, businessId, candidates);
          const reservedMap = new Map(reservedResults.map(r => [r.inventoryItemId, r.reservedQuantity]));

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
            throw new Error('INVENTORY_CONFLICT_ROLLBACK');
          }

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
            SET "status" = 'CONFIRMED'::"BookingStatus", "updatedAt" = NOW()
            WHERE "id" = ${bookingId}
          `;

          await tx.auditEvent.create({
            data: {
              businessId,
              userId,
              action: 'UPDATE',
              tableName: 'bookings',
              recordId: bookingId,
              after: { status: 'CONFIRMED' }
            }
          });

          return { data: { id: bookingId, status: 'CONFIRMED' } };
        },
        {
          maxWait: 30000,
          timeout: 30000,
        }
      );
    } catch (error: any) {
      if (error.message === 'INVENTORY_CONFLICT_ROLLBACK') {
        const apiError: any = new ApiError(409, 'INVENTORY_CONFLICT', 'Booking cannot be confirmed due to inventory shortages.');
        transactionError = apiError;
      } else {
        transactionError = error;
      }
    }

    if (transactionError) {
      if (transactionError.code === 'INVENTORY_CONFLICT') {
        const conflictDetails = await this.availabilityRepo.findOverlappingReservationDetails(businessId, shortageCandidates);
        
        const conflictsList = conflictDetails.map(detail => ({
          reservationId: detail.id,
          bookingId: detail.bookingId,
          eventName: detail.eventName,
          quantity: detail.quantity,
          period: {
            start: detail.effectiveStart.toISOString(),
            end: detail.effectiveEnd.toISOString(),
          }
        }));

        transactionError.items = inventoryConflictItems;
        transactionError.conflicts = conflictsList;
      }
      
      throw transactionError;
    }

    return finalResponseBody;
  }
}
