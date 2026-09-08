import { Router, Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate as requireAuth } from '../../middleware/authenticate';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { businessId } = req.auth!;
    const type = req.query.type as string | undefined; // 'ALL' | 'DAMAGED' | 'MISSING'

    const results: Array<{
      id: string;
      type: 'DAMAGED' | 'MISSING';
      inventoryItemId: string;
      inventoryItemName: string;
      sku: string | null;
      quantity: number;
      bookingId: string | null;
      bookingName: string | null;
      returnId: string | null;
      reportedAt: string;
      description: string;
      status: string;
    }> = [];

    if (type !== 'MISSING') {
      const damageReports = await prisma.damageReport.findMany({
        where: { businessId },
        include: {
          inventoryItem: {
            select: { id: true, name: true, sku: true },
          },
          booking: {
            select: { id: true, eventName: true },
          },
          returnLine: {
            select: { returnId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const report of damageReports) {
        results.push({
          id: report.id,
          type: 'DAMAGED',
          inventoryItemId: report.inventoryItemId,
          inventoryItemName: report.inventoryItem?.name || 'Unknown Item',
          sku: report.inventoryItem?.sku || null,
          quantity: report.quantityDamaged || report.quantity || 1,
          bookingId: report.bookingId,
          bookingName: report.booking?.eventName || null,
          returnId: report.returnLine?.returnId || null,
          reportedAt: report.createdAt.toISOString(),
          description: report.description || 'Damaged during rental',
          status: report.status,
        });
      }
    }

    if (type !== 'DAMAGED') {
      const missingReturnLines = await prisma.returnLine.findMany({
        where: {
          return: { businessId },
          missingQty: { gt: 0 },
        },
        include: {
          inventoryItem: {
            select: { id: true, name: true, sku: true },
          },
          return: {
            include: {
              booking: {
                select: { id: true, eventName: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      for (const line of missingReturnLines) {
        results.push({
          id: line.id,
          type: 'MISSING',
          inventoryItemId: line.inventoryItemId,
          inventoryItemName: line.inventoryItem?.name || 'Unknown Item',
          sku: line.inventoryItem?.sku || null,
          quantity: line.missingQty,
          bookingId: line.return.bookingId,
          bookingName: line.return.booking?.eventName || null,
          returnId: line.returnId,
          reportedAt: line.createdAt.toISOString(),
          description: line.notes || 'Missing on return inspection',
          status: 'REPORTED',
        });
      }
    }

    // Sort combined by reportedAt desc
    results.sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

    res.status(200).json({ data: results });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export const damageReportsRouter = router;
