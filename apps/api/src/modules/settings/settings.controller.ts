import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { updateBusinessSettingsSchema } from './settings.schemas';

export class SettingsController {
  async getBusinessSettings(req: Request, res: Response) {
    const businessId = req.user!.businessId;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        defaultBufferBeforeMinutes: true,
        defaultBufferAfterMinutes: true,
      },
    });

    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }

    res.json(business);
  }

  async updateBusinessSettings(req: Request, res: Response) {
    const businessId = req.user!.businessId;
    const body = updateBusinessSettingsSchema.parse(req.body);

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: body,
      select: {
        defaultBufferBeforeMinutes: true,
        defaultBufferAfterMinutes: true,
      },
    });

    res.json(updated);
  }
}
