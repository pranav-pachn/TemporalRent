import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { inventoryController } from './inventory.controller';

export const inventoryRouter = Router();

// Protect all inventory routes with authentication
inventoryRouter.use(authenticate);

// Read inventory: All roles permitted
inventoryRouter.get(
  '/',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => inventoryController.list(req, res)
);

inventoryRouter.get(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => inventoryController.getById(req, res)
);

inventoryRouter.get(
  '/:id/movements',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.SALES, UserRole.WAREHOUSE),
  (req, res) => inventoryController.movements(req, res)
);

// Mutate inventory: Restricted to OWNER, ADMIN, and WAREHOUSE
inventoryRouter.post(
  '/',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.create(req, res)
);

inventoryRouter.patch(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.update(req, res)
);

inventoryRouter.delete(
  '/:id',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.delete(req, res)
);

inventoryRouter.post(
  '/:id/adjust',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.adjust(req, res)
);

inventoryRouter.post(
  '/:id/damage',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.damage(req, res)
);

inventoryRouter.post(
  '/:id/missing',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.missing(req, res)
);

inventoryRouter.post(
  '/:id/maintenance',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.maintenance(req, res)
);

inventoryRouter.post(
  '/:id/maintenance/restore',
  authorize(UserRole.OWNER, UserRole.ADMIN, UserRole.WAREHOUSE),
  (req, res) => inventoryController.restoreMaintenance(req, res)
);
