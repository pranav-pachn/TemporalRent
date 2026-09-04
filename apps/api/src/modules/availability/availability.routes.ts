import { Router } from 'express';
import { checkAvailabilityHandler } from './availability.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

// Availability checks are allowed for all roles (OWNER, ADMIN, SALES, WAREHOUSE)
router.post('/check', authenticate, authorize('OWNER', 'ADMIN', 'SALES', 'WAREHOUSE'), checkAvailabilityHandler);

export const availabilityRouter = router;
