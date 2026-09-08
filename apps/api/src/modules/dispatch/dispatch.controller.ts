import { Request, Response } from 'express';
import { z } from 'zod';
import { DispatchService } from './dispatch.service';
import { confirmDispatchSchema } from './dispatch.schemas';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';

const dispatchService = new DispatchService();
const idempotencyService = new IdempotencyService();

export class DispatchController {
  async list(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const status = req.query.status as string | undefined;
      const dispatches = await dispatchService.listDispatches(businessId, status);
      res.status(200).json({ data: dispatches });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id } = req.params;
      const dispatch = await dispatchService.getDispatchById(businessId, id);
      if (!dispatch) {
        return res.status(404).json({ error: 'Dispatch not found' });
      }
      res.status(200).json({ data: dispatch });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  async getByBookingId(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id: bookingId } = req.params;
      const dispatch = await dispatchService.getDispatchByBookingId(businessId, bookingId);
      if (!dispatch) {
        return res.status(404).json({ error: 'Dispatch not found for booking' });
      }
      res.status(200).json({ data: dispatch });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
  async prepare(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id: bookingId } = req.params;

      const dispatch = await dispatchService.prepareDispatch(businessId, bookingId, userId);
      res.status(201).json({ data: dispatch });
    } catch (error) {
      if ((error as any).code === 'CONFLICT') {
        res.status(409).json({ error: (error as Error).message });
      } else if ((error as any).code === 'BAD_REQUEST') {
        res.status(400).json({ error: (error as Error).message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async startPicking(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id: bookingId } = req.params;

      const dispatch = await dispatchService.startPicking(businessId, bookingId, userId);
      res.status(200).json({ data: dispatch });
    } catch (error) {
      if ((error as any).code === 'CONFLICT') {
        res.status(409).json({ error: (error as Error).message });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async confirm(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id: bookingId } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const input = confirmDispatchSchema.parse(req.body);

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation: 'DISPATCH',
        bookingId,
        payload: input,
        execute: async () => {
          const data = await dispatchService.confirmDispatch(businessId, bookingId, userId, input);
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
