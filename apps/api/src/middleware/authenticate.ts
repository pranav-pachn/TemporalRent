import { Request, Response, NextFunction } from 'express';
import { validateSession } from '../lib/session';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  // Check for session cookie first (primary mechanism for browser)
  let token = req.cookies?.tr_session;

  // Fallback to Bearer token for external API clients
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Authentication token required',
    });
  }

  try {
    const session = await validateSession(token);
    
    if (session && session.user) {
      if (!session.businessId && req.path !== '/workspace-setup' && req.path !== '/me') {
        return res.status(403).json({
          code: 'ONBOARDING_INCOMPLETE',
          message: 'Workspace setup is required',
        });
      }

      req.auth = {
        userId: session.user.id,
        businessId: session.businessId || '',
        role: session.user.role,
      };
      req.user = session.user;

      return next();
    }

    // Fallback: check if valid JWT (for external API clients and integration tests)
    try {
      const { verifyAccessToken } = await import('../lib/jwt');
      const jwtPayload = await verifyAccessToken(token);
      req.auth = {
        userId: jwtPayload.userId,
        businessId: jwtPayload.businessId,
        role: jwtPayload.role,
      };
      return next();
    } catch {
      // Neither session nor JWT valid
    }

    res.clearCookie('tr_session');
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Invalid or expired session',
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('tr_session');
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Authentication failed',
    });
  }
}
