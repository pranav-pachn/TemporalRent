import { Request, Response } from 'express';
import { checkAvailabilitySchema } from './availability.schemas';
import { AvailabilityService } from './availability.service';
import { ApiError } from '../../lib/errors';

const service = new AvailabilityService();

export async function checkAvailabilityHandler(req: Request, res: Response) {
  const result = checkAvailabilitySchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      errors: result.error.errors,
    });
  }

  const { lines, eventStart, eventEnd } = result.data;
  const businessId = req.auth!.businessId;

  try {
    const availability = await service.checkAvailability(
      businessId,
      lines,
      eventStart,
      eventEnd
    );

    res.status(200).json({
      data: availability,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        code: error.code,
        message: error.message,
      });
    }
    console.error('Availability error:', error);
    res.status(500).json({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred during availability check',
    });
  }
}
