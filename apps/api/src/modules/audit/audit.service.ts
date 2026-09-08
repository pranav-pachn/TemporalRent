import { Prisma, AuditAction, AuditEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { ListAuditEventsQuery } from './audit.schemas';

export interface AuditEventPayload {
  businessId: string;
  userId?: string | null;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  bookingId?: string;
  before?: any;
  after?: any;
  reason?: string;
  metadata?: any;
}

export class AuditService {
  /**
   * Helper to construct and return an AuditEvent creation promise to be executed within a transaction.
   * Note: This assumes it's called within a Prisma transaction (`tx`).
   */
  async recordAuditEvent(tx: Prisma.TransactionClient, payload: AuditEventPayload) {
    if (payload.action === AuditAction.OVERRIDE) {
      if (!payload.reason || payload.reason.trim().length === 0 || payload.reason.length > 500) {
        const err = new Error('OVERRIDE action requires a valid reason between 1 and 500 characters.');
        (err as any).code = 'BAD_REQUEST';
        throw err;
      }
    }

    return tx.auditEvent.create({
      data: {
        businessId: payload.businessId,
        userId: payload.userId,
        bookingId: payload.bookingId,
        action: payload.action,
        entityType: payload.entityType,
        entityId: payload.entityId,
        before: payload.before ?? Prisma.DbNull,
        after: payload.after ?? Prisma.DbNull,
        reason: payload.reason,
        metadata: payload.metadata ?? Prisma.DbNull,
      },
    });
  }

  async listAuditEvents(businessId: string, query: ListAuditEventsQuery) {
    const { entityType, entityId, action, userId, from, to, page, limit } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditEventWhereInput = { businessId };

    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditEvent.count({ where }),
    ]);

    return { events, total, page, limit };
  }

  async getBookingAuditTrail(businessId: string, bookingId: string) {
    // Return all events associated directly with the bookingId
    return prisma.auditEvent.findMany({
      where: {
        businessId,
        bookingId,
      },
      orderBy: [
        { createdAt: 'asc' },
        { id: 'asc' } // Tie-breaker
      ],
    });
  }
}
