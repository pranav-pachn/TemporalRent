import { z } from 'zod';

export const completeReturnSchema = z.object({
  lines: z.array(
    z.object({
      dispatchLineId: z.string().uuid(),
      returnedGoodQty: z.number().int().min(0),
      damagedQty: z.number().int().min(0),
      missingQty: z.number().int().min(0),
      damageDetails: z.string().optional(),
      notes: z.string().optional(),
    })
  ).min(1),
});

export type CompleteReturnInput = z.infer<typeof completeReturnSchema>;
