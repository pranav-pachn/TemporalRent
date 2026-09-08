import { z } from 'zod';

export const prepareDispatchSchema = z.object({});

export const confirmDispatchSchema = z.object({
  lines: z.array(
    z.object({
      dispatchLineId: z.string().uuid(),
      dispatchedQty: z.number().int().min(0),
    })
  ).min(1),
});

export type PrepareDispatchInput = z.infer<typeof prepareDispatchSchema>;
export type ConfirmDispatchInput = z.infer<typeof confirmDispatchSchema>;
