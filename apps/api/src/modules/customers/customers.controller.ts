import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';

export class CustomersController {
  async getList(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      
      const customers = await prisma.customer.findMany({
        where: { businessId, deletedAt: null },
        orderBy: { name: 'asc' },
      });

      res.status(200).json({ data: customers });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }
}
