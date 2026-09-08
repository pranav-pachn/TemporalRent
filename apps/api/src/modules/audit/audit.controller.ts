import { Request, Response } from 'express';
import { z } from 'zod';
import { AuditService } from './audit.service';
import { listAuditEventsSchema } from './audit.schemas';

const auditService = new AuditService();

export class AuditController {
  async list(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const query = listAuditEventsSchema.parse(req.query);

      const result = await auditService.listAuditEvents(businessId, query);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Validation Error', details: error.errors });
      } else {
        res.status(500).json({ error: (error as Error).message });
      }
    }
  }

  async getBookingTimeline(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id: bookingId } = req.params;

      const events = await auditService.getBookingAuditTrail(businessId, bookingId);
      res.json({ data: events });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
