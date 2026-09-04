export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  WAREHOUSE = 'WAREHOUSE',
}

export enum BookingStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  CONFIRMED = 'CONFIRMED',
  DISPATCHED = 'DISPATCHED',
  RETURNED = 'RETURNED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  ACTIVE = 'ACTIVE',
}

export const BOOKING_TRANSITIONS: Record<BookingStatus, readonly BookingStatus[]> = {
  [BookingStatus.DRAFT]: [BookingStatus.QUOTED, BookingStatus.CANCELLED],
  [BookingStatus.QUOTED]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [BookingStatus.DISPATCHED, BookingStatus.CANCELLED],
  [BookingStatus.DISPATCHED]: [BookingStatus.RETURNED],
  [BookingStatus.RETURNED]: [BookingStatus.COMPLETED],
  [BookingStatus.COMPLETED]: [],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.ACTIVE]: [], // Legacy support
} as const;

export enum MovementType {
  ADJUSTMENT = 'ADJUSTMENT',
  DAMAGE = 'DAMAGE',
  MISSING = 'MISSING',
  MAINTENANCE = 'MAINTENANCE',
  MAINTENANCE_RESTORE = 'MAINTENANCE_RESTORE',
  CHECK_OUT = 'CHECK_OUT',
  CHECK_IN = 'CHECK_IN',
  DAMAGE_WRITE_OFF = 'DAMAGE_WRITE_OFF',
}

export enum DamageStatus {
  REPORTED = 'REPORTED',
  ASSESSED = 'ASSESSED',
  REPAIRED = 'REPAIRED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export enum PackageVersionStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
}

export enum IdempotencyOperation {
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
  RESCHEDULE = 'RESCHEDULE',
  DISPATCH = 'DISPATCH',
  RETURN = 'RETURN',
  COMPLETE = 'COMPLETE',
}

export enum IdempotencyStatus {
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
}

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};
