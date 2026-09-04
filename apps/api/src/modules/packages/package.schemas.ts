import { z } from 'zod';

export const createPackageSchema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
});

export const updatePackageSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
});

export const packageComponentInputSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  quantity: z.number().int().positive('Quantity must be greater than zero'),
});

export const createVersionSchema = z.object({
  components: z
    .array(packageComponentInputSchema)
    .min(1, 'At least one component is required to create a package version'),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type PackageComponentInput = z.infer<typeof packageComponentInputSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;
