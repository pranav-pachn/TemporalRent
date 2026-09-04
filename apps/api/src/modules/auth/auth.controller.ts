import { Request, Response } from 'express';
import { registerSchema, loginSchema } from './auth.schemas';
import { authService } from './auth.service';

export class AuthController {
  async register(req: Request, res: Response) {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await authService.register(parseResult.data);
      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'BUSINESS_SLUG_TAKEN') {
        return res.status(409).json({
          code: 'BUSINESS_SLUG_TAKEN',
          message: 'This business slug is already in use',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Registration failed',
      });
    }
  }

  async login(req: Request, res: Response) {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        errors: parseResult.error.flatten().fieldErrors,
      });
    }

    try {
      const result = await authService.login(parseResult.data);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        return res.status(401).json({
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
        });
      }
      if (error instanceof Error && error.message === 'AMBIGUOUS_TENANT') {
        return res.status(400).json({
          code: 'AMBIGUOUS_TENANT',
          message: 'Multiple businesses found for this email. Please provide businessSlug.',
        });
      }
      return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'Login failed',
      });
    }
  }
}

export const authController = new AuthController();
