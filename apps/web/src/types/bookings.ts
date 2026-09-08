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
