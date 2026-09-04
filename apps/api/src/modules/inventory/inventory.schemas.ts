import { z } from 'zod';

export const createInventorySchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  totalQty: z.number().int().min(0, 'Total quantity cannot be negative').default(0),
});

export const updateInventoryMetadataSchema = z
  .object({
    name: z.string().min(1).optional(),
    sku: z.string().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    // Explicitly check for forbidden quantity mutations in metadata update
    totalQty: z.never({ message: 'Quantity cannot be modified via metadata update' }).optional(),
    damagedQty: z.never({ message: 'Quantity cannot be modified via metadata update' }).optional(),
    missingQty: z.never({ message: 'Quantity cannot be modified via metadata update' }).optional(),
    maintenanceQty: z.never({ message: 'Quantity cannot be modified via metadata update' }).optional(),
  });

export const adjustInventorySchema = z.object({
  quantityDelta: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity delta cannot be zero',
  }),
  notes: z.string().optional(),
});

export const recordDamageSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  bookingId: z.string().uuid().optional(),
  description: z.string().optional(),
});

export const recordMissingSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  bookingId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const recordMaintenanceSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  notes: z.string().optional(),
});

export const restoreMaintenanceSchema = z.object({
  quantity: z.number().int().positive('Quantity must be greater than zero'),
  notes: z.string().optional(),
});

export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type UpdateInventoryMetadataInput = z.infer<typeof updateInventoryMetadataSchema>;
export type AdjustInventoryInput = z.infer<typeof adjustInventorySchema>;
export type RecordDamageInput = z.infer<typeof recordDamageSchema>;
export type RecordMissingInput = z.infer<typeof recordMissingSchema>;
export type RecordMaintenanceInput = z.infer<typeof recordMaintenanceSchema>;
export type RestoreMaintenanceInput = z.infer<typeof restoreMaintenanceSchema>;
