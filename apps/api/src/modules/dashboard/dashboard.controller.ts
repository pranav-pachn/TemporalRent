import { Request, Response, NextFunction } from 'express';
import { DashboardService } from './dashboard.service';
import { prisma } from '../../lib/prisma';

export class DashboardController {
  private service: DashboardService;

  constructor() {
    this.service = new DashboardService();
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.auth?.businessId;
      const userId = req.auth?.userId;

      if (!businessId || !userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const dashboard = await this.service.getDashboard(businessId);
      
      // Fetch user name and business details for the UI greeting and workspace context
      const [user, business] = await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: { name: true, email: true },
        }),
        prisma.business.findUnique({
          where: { id: businessId },
          select: { name: true, timezone: true },
        }),
      ]);

      const userName = user?.name || user?.email?.split('@')[0] || 'User';
      const businessName = business?.name || 'Workspace';

      res.status(200).json({
        ...dashboard,
        user: { name: userName },
        business: {
          name: businessName,
          timezone: business?.timezone || 'UTC',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}
