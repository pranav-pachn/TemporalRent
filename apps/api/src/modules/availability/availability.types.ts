export interface AvailabilityItemResult {
  inventoryItemId: string;
  required: number;
  usable: number;
  reserved: number;
  available: number;
  shortage: number;
  period: {
    start: string;
    end: string;
  };
}

export interface AvailabilityConflict {
  reservationId: string;
  bookingId: string;
  inventoryItemId: string;
  inventoryItemName?: string;
  eventName?: string;
  quantity: number;
  effectiveStart: string;
  effectiveEnd: string;
}

export interface AvailabilityWarning {
  code: string;
  message: string;
}

export interface AvailabilityResult {
  available: boolean;
  items: AvailabilityItemResult[];
  conflicts?: AvailabilityConflict[];
  warnings?: AvailabilityWarning[];
}
