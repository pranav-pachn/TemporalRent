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
      
      // Optionally fetch user name for the UI greeting 
      // without polluting the auth middleware
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true } // Name isn't in schema, email or logic could be used
      });

      // Name is not on User model in schema (only email), so we can just use email prefix
      const userName = user?.email.split('@')[0] || 'User';

      res.status(200).json({
        ...dashboard,
        user: { name: userName }
      });
    } catch (error) {
      next(error);
    }
  }
}
