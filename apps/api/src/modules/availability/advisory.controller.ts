import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { AvailabilityService } from './availability.service';
import { BookingLineInput } from '../package-expansion/package-expansion.types';

const availabilityService = new AvailabilityService();

export class AdvisoryController {
  async checkBookingAvailability(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id: bookingId } = req.params;

      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { bookingLines: true },
      });

      if (!booking || booking.businessId !== businessId) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      const lines: BookingLineInput[] = booking.bookingLines.map((line) => ({
        type: line.type,
        packageVersionId: line.packageVersionId || undefined,
        inventoryItemId: line.inventoryItemId || undefined,
        quantity: line.quantity,
      }));

      const result = await availabilityService.checkAvailability(
        businessId,
        lines,
        booking.eventStart.toISOString(),
        booking.eventEnd.toISOString()
      );

      return res.status(200).json(result);
    } catch (error: any) {
      const status = error.statusCode || 500;
      return res.status(status).json({
        code: error.code || 'INTERNAL_ERROR',
        error: error.message,
      });
    }
  }
}
