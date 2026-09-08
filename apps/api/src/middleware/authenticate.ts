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
    
    if (!session || !session.user) {
      // Clear invalid cookie
      res.clearCookie('tr_session');
      return res.status(401).json({
        code: 'UNAUTHENTICATED',
        message: 'Invalid or expired session',
      });
    }

    // Reject users who haven't completed onboarding if they access regular API routes
    // (Except for the workspace-setup route, which they need to call to finish onboarding)
    if (!session.businessId && req.path !== '/auth/workspace-setup' && req.path !== '/auth/me') {
      return res.status(403).json({
        code: 'ONBOARDING_INCOMPLETE',
        message: 'Workspace setup is required',
      });
    }

    req.auth = {
      userId: session.user.id,
      businessId: session.businessId || '', // Empty string for not yet onboarded
      role: session.user.role,
    };
    
    // Attach user entity for convenience
    req.user = session.user;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.clearCookie('tr_session');
    return res.status(401).json({
      code: 'UNAUTHENTICATED',
      message: 'Authentication failed',
    });
  }
}
