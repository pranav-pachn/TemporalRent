export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'CONFIRM'
  | 'CANCEL'
  | 'RESCHEDULE'
  | 'START_PICKING'
  | 'DISPATCH'
  | 'RETURN'
  | 'DAMAGE'
  | 'OVERRIDE';

export type AuditEntityType =
  | 'BUSINESS'
  | 'USER'
  | 'CUSTOMER'
  | 'INVENTORY_ITEM'
  | 'PACKAGE'
  | 'PACKAGE_VERSION'
  | 'BOOKING'
  | 'BOOKING_LINE'
  | 'BOOKING_ITEM_DEMAND'
  | 'INVENTORY_RESERVATION'
  | 'DISPATCH'
  | 'DISPATCH_LINE'
  | 'RETURN'
  | 'RETURN_LINE'
  | 'DAMAGE_REPORT';

export interface AuditEventDTO {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;

  businessId: string;
  bookingId?: string | null;
  userId?: string | null;

  reason?: string | null;
  metadata?: Record<string, unknown> | null;

  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;

  createdAt: string;

  actor?: {
    id: string;
    name?: string | null;
    email?: string | null;
  } | null;
}

export interface AuditFilters {
  action?: AuditAction;
  entityType?: AuditEntityType;
  userId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface ListAuditEventsResponse {
  events: AuditEventDTO[];
  total: number;
  page: number;
  limit: number;
}
