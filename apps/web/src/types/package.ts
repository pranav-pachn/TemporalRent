export type PackageVersionStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface PackageComponent {
  id: string;
  inventoryItemId: string;
  quantity: number;
  inventoryItem: {
    id: string;
    name: string;
    sku: string | null;
    totalQty: number;
  };
}

export interface PackageVersion {
  id: string;
  packageId: string;
  versionNumber: number;
  status: PackageVersionStatus;
  createdAt: string;
  updatedAt: string;
  bookingCount: number;
  packageComponents: PackageComponent[];
}

export interface Package {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  packageVersions: PackageVersion[];
}
