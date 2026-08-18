export enum UserRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum BookingStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MovementType {
  CHECK_OUT = 'CHECK_OUT',
  CHECK_IN = 'CHECK_IN',
  ADJUSTMENT = 'ADJUSTMENT',
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
