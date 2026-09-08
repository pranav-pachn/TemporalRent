import { prisma } from '../../lib/prisma';
import { CompleteReturnInput } from './returns.schemas';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

const auditService = new AuditService();
export class ReturnsService {
  async completeReturn(businessId: string, bookingId: string, userId: string, input: CompleteReturnInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock Booking
      const booking = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM "bookings"
        WHERE id = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (!booking.length) {
        throw new Error('Booking not found');
      }

      if (booking[0].status !== 'DISPATCHED') {
        const error = new Error('Booking must be DISPATCHED to process returns');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      // 2. Lock Dispatch & Load Lines
      const dispatch = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM "dispatches"
        WHERE "bookingId" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (!dispatch.length) {
        throw new Error('Dispatch not found for booking');
      }

      const dispatchId = dispatch[0].id;
      const dispatchLines = await tx.dispatchLine.findMany({
        where: { dispatchId },
      });

      // 3. Completeness Validation
      const inputLineIds = new Set(input.lines.map(l => l.dispatchLineId));
      const dispatchedLineIds = new Set(dispatchLines.filter(dl => dl.dispatchedQty > 0).map(dl => dl.id));

      if (inputLineIds.size !== input.lines.length) {
        const error = new Error('Duplicate dispatchLineId in input');
        (error as any).code = 'BAD_REQUEST';
        throw error;
      }

      for (const expectedId of dispatchedLineIds) {
        if (!inputLineIds.has(expectedId)) {
          const error = new Error(`Missing return data for dispatched line: ${expectedId}`);
          (error as any).code = 'BAD_REQUEST';
          throw error;
        }
      }

      for (const providedId of inputLineIds) {
        if (!dispatchedLineIds.has(providedId)) {
          const error = new Error(`Invalid or non-dispatched line ID: ${providedId}`);
          (error as any).code = 'BAD_REQUEST';
          throw error;
        }
      }

      const lineMap = new Map(dispatchLines.map(l => [l.id, l]));

      // 4. Lock Affected Inventory Items (Sorted to prevent deadlocks)
      const affectedItemIds = Array.from(new Set(dispatchLines.map(dl => dl.inventoryItemId))).sort();
      if (affectedItemIds.length > 0) {
        await tx.$queryRawUnsafe(`
          SELECT id FROM "inventory_items"
          WHERE id IN (${affectedItemIds.map(id => `'${id}'`).join(',')})
          ORDER BY id ASC
          FOR UPDATE
        `);
      }

      // 5. Create Return and Lines
      const returnRecord = await tx.return.create({
        data: {
          businessId,
          bookingId,
          status: 'COMPLETED',
          inspectedAt: new Date(),
          inspectedByUserId: userId,
          lines: {
            create: input.lines.map(line => {
              const dl = lineMap.get(line.dispatchLineId)!;
              return {
                dispatchLineId: dl.id,
                inventoryItemId: dl.inventoryItemId,
                expectedQty: dl.dispatchedQty,
                returnedGoodQty: line.returnedGoodQty,
                damagedQty: line.damagedQty,
                missingQty: line.missingQty,
                notes: line.notes,
              };
            }),
          },
        },
        include: { lines: true },
      });

      // 6. Process Conditions & Movement Ledgers
      for (const line of input.lines) {
        const dl = lineMap.get(line.dispatchLineId)!;

        // The database constraint check_return_line_quantities_balanced ensures:
        // expectedQty = returnedGood + damaged + missing
        // So we don't need manual math validation here, Prisma will throw if it violates.

        if (line.damagedQty > 0) {
          if (!line.damageDetails) {
             const error = new Error(`damageDetails required for damaged items on line ${dl.id}`);
             (error as any).code = 'BAD_REQUEST';
             throw error;
          }

          // Fetch current qty for audit
          const oldItem = await tx.inventoryItem.findUniqueOrThrow({ where: { id: dl.inventoryItemId } });

          // Update aggregated damage state
          await tx.inventoryItem.update({
             where: { id: dl.inventoryItemId },
             data: { damagedQty: { increment: line.damagedQty } },
          });

          await auditService.recordAuditEvent(tx, {
            businessId,
            userId,
            bookingId,
            action: AuditAction.DAMAGE,
            entityType: AuditEntityType.INVENTORY_ITEM,
            entityId: dl.inventoryItemId,
            before: { damagedQty: oldItem.damagedQty },
            after: { damagedQty: oldItem.damagedQty + line.damagedQty }
          });

          const rl = returnRecord.lines.find(r => r.dispatchLineId === dl.id)!;

          await tx.damageReport.create({
            data: {
              businessId,
              inventoryItemId: dl.inventoryItemId,
              bookingId,
              returnLineId: rl.id,
              quantityDamaged: line.damagedQty,
              quantity: line.damagedQty,
              description: line.damageDetails,
              status: 'REPORTED'
            }
          });

          // Ledger: physical item crossed threshold back into warehouse as damaged
          await tx.inventoryMovement.create({
            data: {
              businessId,
              inventoryItemId: dl.inventoryItemId,
              bookingId,
              movementType: 'DAMAGE',
              quantityDelta: line.damagedQty,
              createdByUserId: userId,
            },
          });
        }

        if (line.missingQty > 0) {
           await tx.inventoryItem.update({
             where: { id: dl.inventoryItemId },
             data: { missingQty: { increment: line.missingQty } },
          });

          // Ledger: missing items did NOT cross threshold.
          await tx.inventoryMovement.create({
            data: {
              businessId,
              inventoryItemId: dl.inventoryItemId,
              bookingId,
              movementType: 'MISSING',
              quantityDelta: 0,
              createdByUserId: userId,
            },
          });
        }

        if (line.returnedGoodQty > 0) {
           // Ledger: physical item crossed threshold back into warehouse as good
           await tx.inventoryMovement.create({
            data: {
              businessId,
              inventoryItemId: dl.inventoryItemId,
              bookingId,
              movementType: 'RETURN_GOOD',
              quantityDelta: line.returnedGoodQty,
              createdByUserId: userId,
            },
          });
        }
      }

      // 7. Transition Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'RETURNED' },
      });

      // Calculate summary for metadata
      let goodQty = 0;
      let damagedQty = 0;
      let missingQty = 0;
      input.lines.forEach(l => {
        goodQty += l.returnedGoodQty;
        damagedQty += l.damagedQty;
        missingQty += l.missingQty;
      });

      await auditService.recordAuditEvent(tx, {
        businessId,
        userId,
        bookingId,
        action: AuditAction.RETURN,
        entityType: AuditEntityType.RETURN,
        entityId: returnRecord.id,
        before: null,
        after: { status: 'COMPLETED' },
        metadata: { goodQty, damagedQty, missingQty }
      });

      return returnRecord;
    });
  }
}
