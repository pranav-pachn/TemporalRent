import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Authorization token required',
    });
  }

  const token = authHeader.slice(7).trim();

  try {
    const payload = await verifyAccessToken(token);

    // Verify user still exists in database and belongs to the claimed business
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, businessId: true, role: true },
    });

    if (!user || user.businessId !== payload.businessId) {
      return res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: 'Invalid session or business membership',
      });
    }

    req.auth = {
      userId: user.id,
      businessId: user.businessId,
      role: user.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired token',
    });
  }
}
