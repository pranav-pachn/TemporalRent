import { Router } from 'express';
import { authenticate as requireAuth } from '../../middleware/authenticate';
import { ReturnsController } from './returns.controller';

const router = Router({ mergeParams: true });
const controller = new ReturnsController();

router.post('/complete', requireAuth, controller.complete.bind(controller));

export default router;
