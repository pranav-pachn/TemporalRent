export interface CalendarEvent {
  bookingId: string;
  eventName: string;
  customerName: string;
  status: string;
  eventStart: string;
  eventEnd: string;
  periodStart: string;
  periodEnd: string;
}

export interface PressureSegment {
  start: string;
  end: string;
  reservedQty: number;
  usableQty: number;
  pressure: 'NORMAL' | 'FULL' | 'SHORTAGE';
}

export interface CalendarReservation {
  bookingId: string;
  start: string;
  end: string;
  quantity: number;
}

export interface CalendarInventoryItem {
  inventoryItemId: string;
  name: string;
  usableQty: number;
  reservations: CalendarReservation[];
  pressureSegments: PressureSegment[];
}

export interface CalendarInventoryResponse {
  from: string;
  to: string;
  items: CalendarInventoryItem[];
}
