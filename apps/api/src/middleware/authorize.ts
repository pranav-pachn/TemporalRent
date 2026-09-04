import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';

export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.auth.role)) {
      return res.status(403).json({
        code: 'FORBIDDEN',
        message: 'Insufficient permissions for this operation',
      });
    }

    next();
  };
}
