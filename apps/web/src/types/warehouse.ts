export type DispatchStatus = 'READY' | 'PICKING' | 'DISPATCHED' | 'CANCELLED';
export type ReturnStatus = 'INSPECTION' | 'COMPLETED';

export interface DispatchLineDTO {
  id: string;
  dispatchId: string;
  inventoryItemId: string;
  bookingItemDemandId: string;
  expectedQty: number;
  dispatchedQty: number;
  inventoryItem: {
    id: string;
    name: string;
    sku: string | null;
  };
}

export interface DispatchDTO {
  id: string;
  businessId: string;
  bookingId: string;
  status: DispatchStatus;
  dispatchedAt: string | null;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    eventName: string;
    eventStart: string;
    eventEnd: string;
    status: string;
    customer?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
  };
  lines: DispatchLineDTO[];
}

export interface ReturnLineDTO {
  id: string;
  returnId: string;
  dispatchLineId: string;
  inventoryItemId: string;
  expectedQty: number;
  returnedGoodQty: number;
  damagedQty: number;
  missingQty: number;
  notes: string | null;
  inventoryItem: {
    id: string;
    name: string;
    sku: string | null;
  };
  damageReports?: Array<{
    id: string;
    quantityDamaged: number;
    description: string | null;
    status: string;
  }>;
}

export interface ReturnDTO {
  id: string;
  businessId: string;
  bookingId: string;
  status: ReturnStatus;
  inspectedAt: string | null;
  inspectedByUserId: string | null;
  createdAt: string;
  booking: {
    id: string;
    eventName: string;
    eventStart: string;
    eventEnd: string;
    status: string;
    customer?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
  };
  lines: ReturnLineDTO[];
}

export interface AwaitingReturnDTO {
  id: string;
  eventName: string;
  eventStart: string;
  eventEnd: string;
  status: string;
  customer?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  dispatch: {
    id: string;
    status: DispatchStatus;
    dispatchedAt: string | null;
    lines: Array<{
      id: string;
      inventoryItemId: string;
      expectedQty: number;
      dispatchedQty: number;
      inventoryItem: {
        id: string;
        name: string;
        sku: string | null;
      };
    }>;
  };
}

export interface ReturnInspectionLineDTO {
  dispatchLineId: string;
  inventoryItemId: string;
  inventoryItemName: string;
  sku: string | null;
  expectedReturnQty: number;
}

export interface ReturnInspectionDTO {
  booking: {
    id: string;
    eventName: string;
    eventStart: string;
    eventEnd: string;
    status: string;
    customer?: {
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
    } | null;
  };
  dispatch: {
    id: string;
    status: DispatchStatus;
    dispatchedAt: string | null;
    lines: ReturnInspectionLineDTO[];
  };
}

export interface ReturnsListResponse {
  awaiting: AwaitingReturnDTO[];
  completed: ReturnDTO[];
}

export interface ReturnInspectionLineInput {
  dispatchLineId: string;
  returnedGoodQty: number;
  damagedQty: number;
  missingQty: number;
  damageDetails?: string;
  notes?: string;
}

export interface DamageReportDTO {
  id: string;
  type: 'DAMAGED' | 'MISSING';
  inventoryItemId: string;
  inventoryItemName: string;
  sku: string | null;
  quantity: number;
  bookingId: string | null;
  bookingName: string | null;
  returnId: string | null;
  reportedAt: string;
  description: string;
  status: string;
}
