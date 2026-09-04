export interface BookingLineInput {
  type: 'PACKAGE' | 'INVENTORY_ITEM';
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
