export interface BookingLineInput {
  packageVersionId?: string;
  inventoryItemId?: string;
  quantity: number;
}

export interface ExpandedDemand {
  inventoryItemId: string;
  quantity: number;
}
