import { Request, Response } from 'express';
import { z } from 'zod';
import { ReturnsService } from './returns.service';
import { completeReturnSchema } from './returns.schemas';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

const returnsService = new ReturnsService();
const idempotencyService = new IdempotencyService();

export class ReturnsController {
  async complete(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id: bookingId } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const input = completeReturnSchema.parse(req.body);

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation: 'RETURN',
        bookingId,
        payload: input,
        execute: async () => {
          const data = await returnsService.completeReturn(businessId, bookingId, userId, input);
          return { statusCode: 200, body: data };
        },
      });

      res.status(result.statusCode).json({ data: result.body });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else if ((error as any).code === 'CONFLICT') {
        res.status(409).json({ error: (error as Error).message });
      } else if ((error as any).code === 'BAD_REQUEST') {
        res.status(400).json({ error: (error as Error).message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }
}
