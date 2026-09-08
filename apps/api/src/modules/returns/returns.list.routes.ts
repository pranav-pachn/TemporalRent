import { Router } from 'express';
import { authenticate as requireAuth } from '../../middleware/authenticate';
import { ReturnsController } from './returns.controller';

const router = Router();
const controller = new ReturnsController();

router.get('/', requireAuth, controller.list.bind(controller));
router.get('/:bookingId/inspection', requireAuth, controller.getInspection.bind(controller));
router.get('/:id', requireAuth, controller.getById.bind(controller));
router.post('/:id/complete', requireAuth, controller.complete.bind(controller));

export default router;
