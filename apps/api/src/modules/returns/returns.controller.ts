import { Request, Response } from 'express';
import { z } from 'zod';
import { ReturnsService } from './returns.service';
import { completeReturnSchema } from './returns.schemas';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

const returnsService = new ReturnsService();
const idempotencyService = new IdempotencyService();

export class ReturnsController {
  async list(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const [awaiting, completed] = await Promise.all([
        returnsService.listAwaitingReturns(businessId),
        returnsService.listCompletedReturns(businessId),
      ]);
      res.status(200).json({ awaiting, completed });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getInspection(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { bookingId } = req.params;
      const data = await returnsService.getReturnInspectionData(businessId, bookingId);
      res.status(200).json({ data });
    } catch (error) {
      if ((error as any).code === 'NOT_FOUND') {
        res.status(404).json({ error: (error as Error).message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id } = req.params;
      const returnRecord = await returnsService.getReturnById(businessId, id);
      if (!returnRecord) {
        return res.status(404).json({ error: 'Return not found' });
      }
      res.status(200).json({ data: returnRecord });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

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
