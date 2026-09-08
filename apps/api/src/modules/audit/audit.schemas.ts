import { z } from 'zod';
import { AuditAction, AuditEntityType } from '@temporalrent/shared/src/types';

export const listAuditEventsSchema = z.object({
  entityType: z.nativeEnum(AuditEntityType).optional(),
  entityId: z.string().uuid().optional(),
  action: z.nativeEnum(AuditAction).optional(),
  userId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export type ListAuditEventsQuery = z.infer<typeof listAuditEventsSchema>;
