import { Request, Response } from 'express';
import { z } from 'zod';
import { BookingsService } from './bookings.service';
import { createBookingSchema, rescheduleBookingSchema } from './bookings.schemas';
import { ReservationsService } from '../reservations/reservations.service';
import { IdempotencyService } from '../../common/idempotency/idempotency.service';
import { IdempotencyOperation } from '@prisma/client';

const bookingsService = new BookingsService();
const reservationsService = new ReservationsService();
const idempotencyService = new IdempotencyService();

export class BookingsController {
  async createDraft(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const input = createBookingSchema.parse(req.body);
      const booking = await bookingsService.createDraftBooking(businessId, userId, input);
      res.status(201).json({ data: booking });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async patch(req: Request, res: Response) {
    if (req.body && req.body.status !== undefined) {
      return res.status(400).json({
        code: 'STATUS_MUTATION_NOT_ALLOWED',
        message: 'Status mutations via PATCH are not allowed. Use dedicated operational transition endpoints.',
      });
    }
    return res.status(400).json({
      code: 'BAD_REQUEST',
      message: 'Arbitrary updates are rejected. Use operational routes.',
    });
  }

  async cancel(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;
      const reason = req.body?.reason;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation: 'CANCEL',
        bookingId: id,
        payload: { reason },
        execute: async () => {
          const data = await bookingsService.cancelBooking(businessId, id, userId, reason);
          return { statusCode: 200, body: { data } };
        }
      });
      res.status(result.statusCode).json(result.body);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }

  async getList(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      
      const result = await bookingsService.getBookings(businessId, page, limit);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  private async transition(req: Request, res: Response, targetStatus: any, operation: IdempotencyOperation) {
    try {
      const { businessId, userId } = req.auth!;
      const { id } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation,
        bookingId: id,
        payload: {},
        execute: async () => {
          const data = await bookingsService.transitionBooking(businessId, id, userId, targetStatus);
          return { statusCode: 200, body: { data } };
        }
      });
      res.status(result.statusCode).json(result.body);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }

  async quote(req: Request, res: Response) { 
    // Usually not idempotent in Phase 17/18, but wait, the prompt says "mandatory for CONFIRM, CANCEL, RESCHEDULE, DISPATCH, RETURN, and COMPLETE".
    // quote can skip or use dummy. Let's not use idempotency wrapper for QUOTED unless requested. Actually we will use it with 'COMPLETE' for now, wait, quote doesn't have an IdempotencyOperation enum.
    try {
      const { businessId, userId } = req.auth!;
      const { id } = req.params;
      const result = await bookingsService.transitionBooking(businessId, id, userId, 'QUOTED');
      res.status(200).json({ data: result });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }
  async dispatchBooking(req: Request, res: Response) { return this.transition(req, res, 'DISPATCHED', 'DISPATCH'); }
  async returnBooking(req: Request, res: Response) { return this.transition(req, res, 'RETURNED', 'RETURN'); }
  async complete(req: Request, res: Response) { return this.transition(req, res, 'COMPLETED', 'COMPLETE'); }

  async confirm(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation: 'CONFIRM',
        bookingId: id,
        payload: {}, // No body payload for confirm
        execute: async () => {
          // Internal call is wrapped in executeIdempotent
          const data = await reservationsService.confirmBooking({
            businessId,
            bookingId: id,
            userId,
            idempotencyKey,
          });
          return { statusCode: 200, body: data };
        }
      });
      res.status(result.statusCode).json(result.body);
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message, ...error });
    }
  }

  async reschedule(req: Request, res: Response) {
    try {
      const { businessId, userId } = req.auth!;
      const { id } = req.params;
      const idempotencyKey = req.headers['idempotency-key'] as string;

      if (!idempotencyKey) {
        return res.status(400).json({ code: 'MISSING_IDEMPOTENCY_KEY', error: 'Idempotency-Key header is required' });
      }

      const input = rescheduleBookingSchema.parse(req.body);

      const result = await idempotencyService.executeIdempotent({
        businessId,
        key: idempotencyKey,
        operation: 'RESCHEDULE',
        bookingId: id,
        payload: input,
        execute: async () => {
          const data = await bookingsService.rescheduleBooking(businessId, id, userId, input);
          return data;
        }
      });
      res.status(result.statusCode).json(result.body);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation Error', details: error.errors });
      }
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message, ...error });
    }
  }
}
