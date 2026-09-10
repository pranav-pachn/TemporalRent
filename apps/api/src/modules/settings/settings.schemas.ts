import { z } from 'zod';

export const updateBusinessSettingsSchema = z.object({
  defaultBufferBeforeMinutes: z.number().int().min(0).max(10080).optional(),
  defaultBufferAfterMinutes: z.number().int().min(0).max(10080).optional(),
});
