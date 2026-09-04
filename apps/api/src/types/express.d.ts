import { UserRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  businessId: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}
