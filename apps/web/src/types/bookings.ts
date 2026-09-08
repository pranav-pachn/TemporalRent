export type BookingStatus = 'DRAFT' | 'QUOTED' | 'CONFIRMED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type BookingLineType = 'PACKAGE' | 'INVENTORY_ITEM';

export interface BookingLineInput {
  type: BookingLineType;
  packageVersionId?: string;
  inventoryItemId?: string;
  quantity: number;
}

export interface CreateBookingInput {
  customerId: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  location?: string;
  notes?: string;
  lines: BookingLineInput[];
}

export interface BookingDTO {
  id: string;
  businessId: string;
  customerId: string;
  status: BookingStatus;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityItemResult {
  inventoryItemId: string;
  required: number;
  available: number;
  shortage: number;
}

export interface ConflictingReservationDTO {
  reservationId: string;
  bookingId: string;
  bookingName?: string;
  eventName?: string;
  start: string;
  end: string;
  quantity: number;
}

export interface InventoryItemConflictDTO {
  inventoryItemId: string;
  inventoryItemName: string;
  requiredQty: number;
  usableQty: number;
  reservedQty: number;
  availableQty: number;
  shortageQty: number;
  period: {
    start: string;
    end: string;
  };
  conflictingReservations: ConflictingReservationDTO[];
}

export interface InventoryConflictErrorResponse {
  code: 'INVENTORY_CONFLICT';
  message: string;
  conflicts: InventoryItemConflictDTO[];
  items?: any[];
}

export interface AvailabilityResult {
  available: boolean;
  items: AvailabilityItemResult[];
  conflicts: any[]; // Extended conflict explanations if available from backend
}

export interface CustomerDTO {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
}

export interface BookingDetailDTO extends BookingDTO {
  customer: CustomerDTO;
  bookingLines: Array<{
    id: string;
    type: string;
    quantity: number;
    inventoryItem?: any;
    packageVersion?: any;
  }>;
  bookingItemDemands: Array<{
    id: string;
    inventoryItem: any;
    quantityDemanded: number;
  }>;
  inventoryReservations: Array<{
    id: string;
    inventoryItem: any;
    quantity: number;
    period: string;
    status: string;
  }>;
}
