export type InventoryStatus = 'HEALTHY' | 'MAINTENANCE' | 'DAMAGED' | 'MISSING' | 'OUT_OF_STOCK';

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  sku: string | null;
  categoryId: string | null;
  totalQty: number;
  usableQty: number;
  damagedQty: number;
  missingQty: number;
  maintenanceQty: number;
  status: InventoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReservation {
  reservationId: string;
  bookingId: string;
  quantity: number;
  status: 'ACTIVE' | 'CANCELLED';
  start: string;
  end: string;
  eventName: string;
  customerName: string;
}

export interface InventoryBooking {
  id: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  status: 'DRAFT' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  customer: {
    name: string;
  };
}

export interface InventoryDamageReport {
  id: string;
  inventoryItemId: string;
  bookingId: string | null;
  quantityDamaged: number;
  description: string;
  createdAt: string;
  booking: {
    id: string;
    eventName: string;
  } | null;
}

export interface InventoryMovement {
  id: string;
  movementType: 'ADDITION' | 'SUBTRACTION' | 'MAINTENANCE_LOG' | 'MAINTENANCE_RESTORE' | 'DAMAGE_LOG' | 'MISSING_LOG';
  quantityDelta: number;
  notes: string | null;
  createdAt: string;
  createdByUser: {
    id: string;
    email: string;
    role: string;
  } | null;
}
