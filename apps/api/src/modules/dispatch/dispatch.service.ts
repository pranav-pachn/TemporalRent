import { prisma } from '../../lib/prisma';
import { ConfirmDispatchInput } from './dispatch.schemas';
import { AuditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '@prisma/client';

const auditService = new AuditService();export class DispatchService {
  async prepareDispatch(businessId: string, bookingId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock Booking
      const booking = await tx.booking.findUnique({
        where: { id: bookingId, businessId },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'CONFIRMED') {
        const error = new Error('Booking must be CONFIRMED to prepare dispatch');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      // 2. Check if Dispatch already exists (enforced by DB UNIQUE, but we check here for better error message)
      const existingDispatch = await tx.dispatch.findUnique({
        where: { bookingId },
      });

      if (existingDispatch) {
        const error = new Error('Dispatch already exists for this booking');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      // 3. Load demand
      const demands = await tx.bookingItemDemand.findMany({
        where: { bookingId, businessId },
      });

      if (demands.length === 0) {
        const error = new Error('No demands found for booking');
        (error as any).code = 'BAD_REQUEST';
        throw error;
      }

      // 4. Create Dispatch and Lines (Operational Snapshot)
      const dispatch = await tx.dispatch.create({
        data: {
          businessId,
          bookingId,
          status: 'READY',
          lines: {
            create: demands.map((demand) => ({
              inventoryItemId: demand.inventoryItemId,
              bookingItemDemandId: demand.id,
              expectedQty: demand.quantityDemanded,
              dispatchedQty: 0,
            })),
          },
        },
        include: { lines: true },
      });

      await auditService.recordAuditEvent(tx, {
        businessId,
        userId,
        bookingId,
        action: AuditAction.CREATE,
        entityType: AuditEntityType.DISPATCH,
        entityId: dispatch.id,
        after: { status: 'READY', linesCount: dispatch.lines.length },
        metadata: { bookingId }
      });

      return dispatch;
    });
  }

  async startPicking(businessId: string, bookingId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      const dispatch = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM "dispatches"
        WHERE "bookingId" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (!dispatch.length) {
        throw new Error('Dispatch not found');
      }
      if (dispatch[0].status !== 'READY') {
        const error = new Error('Dispatch must be in READY state to start picking');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      const updated = await tx.dispatch.update({
        where: { id: dispatch[0].id },
        data: { status: 'PICKING' }
      });

      await auditService.recordAuditEvent(tx, {
        businessId,
        userId,
        bookingId,
        action: AuditAction.START_PICKING,
        entityType: AuditEntityType.DISPATCH,
        entityId: dispatch[0].id,
        before: { status: 'READY' },
        after: { status: 'PICKING' }
      });

      return updated;
    });
  }

  async confirmDispatch(businessId: string, bookingId: string, userId: string, input: ConfirmDispatchInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Lock Booking and Dispatch
      const booking = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM "bookings"
        WHERE id = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (!booking.length) {
        throw new Error('Booking not found');
      }
      if (booking[0].status !== 'CONFIRMED') {
        const error = new Error('Booking must be CONFIRMED to dispatch');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      const dispatch = await tx.$queryRaw<{ id: string; status: string }[]>`
        SELECT id, status FROM "dispatches"
        WHERE "bookingId" = ${bookingId} AND "businessId" = ${businessId}
        FOR UPDATE
      `;

      if (!dispatch.length) {
        throw new Error('Dispatch not found. Call prepareDispatch first.');
      }
      if (dispatch[0].status !== 'PICKING') {
        const error = new Error('Dispatch is not in PICKING state');
        (error as any).code = 'CONFLICT';
        throw error;
      }

      const dispatchId = dispatch[0].id;

      // 2. Load Dispatch Lines for mapping
      const dispatchLines = await tx.dispatchLine.findMany({
        where: { dispatchId },
      });

      const lineMap = new Map(dispatchLines.map(l => [l.id, l]));

      // 3. Process each line
      for (const line of input.lines) {
        const dl = lineMap.get(line.dispatchLineId);
        if (!dl) {
          const error = new Error(`Invalid dispatchLineId: ${line.dispatchLineId}`);
          (error as any).code = 'BAD_REQUEST';
          throw error;
        }

        if (line.dispatchedQty < 0 || line.dispatchedQty > dl.expectedQty) {
          const error = new Error(`Invalid dispatchedQty for line ${dl.id}. Must be between 0 and ${dl.expectedQty}`);
          (error as any).code = 'BAD_REQUEST';
          throw error;
        }

        // Update dispatch line
        await tx.dispatchLine.update({
          where: { id: dl.id },
          data: { dispatchedQty: line.dispatchedQty },
        });

        // 4. Append physical movement ledger (-qty leaving warehouse)
        if (line.dispatchedQty > 0) {
          await tx.inventoryMovement.create({
            data: {
              businessId,
              inventoryItemId: dl.inventoryItemId,
              bookingId,
              movementType: 'DISPATCH',
              quantityDelta: -line.dispatchedQty,
              createdByUserId: userId,
            },
          });
        }
      }

      // 5. Transition Dispatch & Booking Statuses
      const updatedDispatch = await tx.dispatch.update({
        where: { id: dispatchId },
        data: {
          status: 'DISPATCHED',
          dispatchedAt: new Date(),
        },
        include: { lines: true },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'DISPATCHED' },
      });

      await auditService.recordAuditEvent(tx, {
        businessId,
        userId,
        bookingId,
        action: AuditAction.DISPATCH,
        entityType: AuditEntityType.DISPATCH,
        entityId: dispatchId,
        before: { status: 'PICKING' },
        after: { status: 'DISPATCHED' },
        metadata: { lineCount: input.lines.length }
      });

      return updatedDispatch;
    });
  }

  async listDispatches(businessId: string, status?: any) {
    return prisma.dispatch.findMany({
      where: {
        businessId,
        ...(status ? { status } : {}),
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
        lines: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDispatchById(businessId: string, id: string) {
    return prisma.dispatch.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
        lines: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  }

  async getDispatchByBookingId(businessId: string, bookingId: string) {
    return prisma.dispatch.findFirst({
      where: {
        bookingId,
        businessId,
      },
      include: {
        booking: {
          include: {
            customer: true,
          },
        },
        lines: {
          include: {
            inventoryItem: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });
  }
}
