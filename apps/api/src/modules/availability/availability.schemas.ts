import { z } from 'zod';

export const checkAvailabilitySchema = z.object({
  lines: z.array(
    z.object({
      packageVersionId: z.string().uuid().optional(),
      inventoryItemId: z.string().uuid().optional(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'At least one line item is required'),
  eventStart: z.string().datetime(),
  eventEnd: z.string().datetime(),
}).refine(data => new Date(data.eventStart) < new Date(data.eventEnd), {
  message: 'eventStart must be before eventEnd',
  path: ['eventStart'],
});

export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;
