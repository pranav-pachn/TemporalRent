import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { createCustomerSchema } from './customers.schemas';

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

  async create(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const parseResult = createCustomerSchema.safeParse(req.body);

      if (!parseResult.success) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const { name, email, phone } = parseResult.data;

      const customer = await prisma.customer.create({
        data: {
          businessId,
          name: name.trim(),
          email: email?.trim() ? email.trim() : null,
          phone: phone?.trim() ? phone.trim() : null,
        },
      });

      res.status(201).json({ data: customer });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const { businessId } = req.auth!;
      const { id } = req.params;

      const customer = await prisma.customer.findFirst({
        where: { id, businessId, deletedAt: null },
      });

      if (!customer) {
        return res.status(404).json({ code: 'NOT_FOUND', message: 'Customer not found' });
      }

      await prisma.customer.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      res.status(200).json({ message: 'Customer removed successfully' });
    } catch (error: any) {
      const status = error.statusCode || 500;
      res.status(status).json({ code: error.code || 'INTERNAL_ERROR', error: error.message });
    }
  }
}
