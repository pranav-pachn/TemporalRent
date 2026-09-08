import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';

export const authRouter = Router();

authRouter.get('/google', (req, res) => authController.googleLogin(req, res));
authRouter.get('/google/callback', (req, res) => authController.googleCallback(req, res));
authRouter.post('/workspace-setup', authenticate, (req, res) => authController.workspaceSetup(req, res));
authRouter.get('/me', authenticate, (req, res) => authController.me(req, res));
authRouter.post('/logout', (req, res) => authController.logout(req, res));
