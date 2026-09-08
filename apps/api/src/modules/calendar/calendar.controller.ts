import { Request, Response } from 'express';
import { CalendarService } from './calendar.service';
import { z } from 'zod';

const calendarService = new CalendarService();

const getCalendarSchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'from must be YYYY-MM-DD'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'to must be YYYY-MM-DD'),
  inventoryItemId: z.string().uuid().optional(),
});

export class CalendarController {
  async getEvents(req: Request, res: Response) {
    try {
      const result = getCalendarSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: result.error.errors });
      }

      const { businessId } = req.auth!;
      const { from, to } = result.data;

      const events = await calendarService.getEvents(businessId, from, to);
      return res.status(200).json({ data: events });
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Failed to fetch calendar events' });
    }
  }

  async getInventoryTimeline(req: Request, res: Response) {
    try {
      const result = getCalendarSchema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: 'Invalid query parameters', details: result.error.errors });
      }

      const { businessId } = req.auth!;
      const { from, to, inventoryItemId } = result.data;

      const timeline = await calendarService.getInventoryTimeline(businessId, from, to, inventoryItemId);
      return res.status(200).json({ data: timeline });
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({ error: error.message || 'Failed to fetch inventory timeline' });
    }
  }
}
