import { z } from 'zod';

export const bookingLineSchema = z.object({
  type: z.enum(['PACKAGE', 'INVENTORY_ITEM']),
  packageVersionId: z.string().uuid().optional(),
  inventoryItemId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
}).refine(data => {
  if (data.type === 'PACKAGE') {
    return data.packageVersionId !== undefined && data.inventoryItemId === undefined;
  }
  if (data.type === 'INVENTORY_ITEM') {
    return data.inventoryItemId !== undefined && data.packageVersionId === undefined;
  }
  return false;
}, {
  message: 'Invalid polymorphic reference. Provide exactly one of packageVersionId or inventoryItemId matching the type.',
});

export const createBookingSchema = z.object({
  customerId: z.string().uuid(),
  eventName: z.string().min(1),
  eventStart: z.string().datetime(),
  eventEnd: z.string().datetime(),
  location: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(bookingLineSchema).min(1),
}).refine(data => {
  return new Date(data.eventStart) < new Date(data.eventEnd);
}, {
  message: 'eventStart must be before eventEnd',
  path: ['eventEnd'],
});

export const rescheduleBookingSchema = z.object({
  eventStart: z.string().datetime(),
  eventEnd: z.string().datetime(),
}).refine(data => new Date(data.eventStart).getTime() < new Date(data.eventEnd).getTime(), {
  message: 'eventStart must be strictly before eventEnd',
  path: ['eventEnd'],
});
