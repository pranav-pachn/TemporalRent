import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { packageController } from './package.controller';

export const packageRouter = Router();

// Protect all package routes with authentication
packageRouter.use(authenticate);

// View packages: All roles permitted
packageRouter.get(
  '/',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => packageController.list(req, res)
);

packageRouter.get(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => packageController.getById(req, res)
);

packageRouter.get(
  '/:packageId/versions',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => packageController.listVersions(req, res)
);

// Mutate packages: Restricted to OWNER, ADMIN, and WAREHOUSE
packageRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => packageController.create(req, res)
);

packageRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => packageController.update(req, res)
);

packageRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => packageController.delete(req, res)
);

packageRouter.post(
  '/:packageId/versions',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => packageController.createVersion(req, res)
);

// Package Version Direct Router (for /api/package-versions)
export const packageVersionRouter = Router();
packageVersionRouter.use(authenticate);

packageVersionRouter.get(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => packageController.getVersionById(req, res)
);

packageVersionRouter.post(
  '/:id/activate',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => packageController.activateVersion(req, res)
);
