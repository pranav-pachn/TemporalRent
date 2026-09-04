import { Router } from 'express';
import { authController } from './auth.controller';

export const authRouter = Router();

authRouter.post('/register', (req, res) => authController.register(req, res));
authRouter.post('/login', (req, res) => authController.login(req, res));
