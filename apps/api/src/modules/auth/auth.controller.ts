import { Request, Response } from 'express';
import { authService } from './auth.service';
import { getGoogleAuthUrl } from '../../lib/google';
import { workspaceSetupSchema } from './auth.schemas';
import { prisma } from '../../lib/prisma';

// CSRF State storage via cookies is more robust for dev server restarts than in-memory
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export class AuthController {
  async googleLogin(req: Request, res: Response) {
    try {
      const state = await authService.generateOAuthState();
      
      // Set state in cookie for 10 minutes
      res.cookie('oauth_state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000,
        sameSite: 'lax'
      });

      const url = getGoogleAuthUrl(state);
      res.redirect(url);
    } catch (error) {
      res.status(500).json({ code: 'OAUTH_ERROR', message: 'Failed to initiate login' });
    }
  }

  async googleCallback(req: Request, res: Response) {
    try {
      const { code, state, error } = req.query;
      const savedState = req.cookies?.oauth_state;

      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect(`${FRONTEND_URL}/login?error=access_denied`);
      }

      if (!state || state !== savedState) {
        console.error('State mismatch. Expected:', savedState, 'Got:', state);
        return res.status(400).send('OAuth state mismatch. Please try logging in again.');
      }
      
      // Clear the state cookie
      res.clearCookie('oauth_state');

      if (!code || typeof code !== 'string') {
        return res.status(400).send('No authorization code provided');
      }

      const result = await authService.handleGoogleCallback(code);

      res.cookie('tr_session', result.session.token, COOKIE_OPTIONS);

      if (result.isNewUser || !result.user.businessId) {
        res.redirect(`${FRONTEND_URL}/setup`);
      } else {
        res.redirect(`${FRONTEND_URL}/dashboard`);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=callback_failed`);
    }
  }

  async workspaceSetup(req: Request, res: Response) {
    try {
      const parseResult = workspaceSetupSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          code: 'VALIDATION_ERROR',
          errors: parseResult.error.flatten().fieldErrors,
        });
      }

      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ code: 'UNAUTHENTICATED' });
      }

      const result = await authService.setupWorkspace(userId, parseResult.data);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'BUSINESS_SLUG_TAKEN') {
        return res.status(409).json({
          code: 'BUSINESS_SLUG_TAKEN',
          message: 'This business name is already in use, please choose another.',
        });
      }
      return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Workspace setup failed' });
    }
  }

  async me(req: Request, res: Response) {
    if (!req.auth?.userId) {
      return res.status(401).json({ code: 'UNAUTHENTICATED' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      include: { business: true },
    });

    if (!user) {
      return res.status(404).json({ code: 'USER_NOT_FOUND' });
    }

    // Don't send password hash
    const { passwordHash, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, business: user.business });
  }

  async devLogin(req: Request, res: Response) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Not available in production' });
    }

    try {
      let user = await prisma.user.findFirst({
        where: { email: 'admin@acme.com' },
        include: { business: true },
      });

      if (!user) {
        let business = await prisma.business.findFirst({
          where: { slug: 'acme-events' },
        });

        if (!business) {
          business = await prisma.business.create({
            data: {
              name: 'Acme Event Rentals',
              slug: 'acme-events',
              timezone: 'America/New_York',
            },
          });
        }

        user = await prisma.user.create({
          data: {
            businessId: business.id,
            email: 'admin@acme.com',
            name: 'Admin User',
            role: 'OWNER',
          },
          include: { business: true },
        });
      }

      const { createSession } = await import('../../lib/session');
      const session = await createSession(user.id, user.businessId);

      res.cookie('tr_session', session.token, COOKIE_OPTIONS);

      const { passwordHash, ...safeUser } = user;
      return res.status(200).json({
        user: safeUser,
        business: user.business,
      });
    } catch (error) {
      console.error('Dev login error:', error);
      return res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Dev login failed' });
    }
  }

  async logout(req: Request, res: Response) {
    const token = req.cookies?.tr_session;
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie('tr_session');
    res.status(200).json({ success: true });
  }
}

export const authController = new AuthController();
