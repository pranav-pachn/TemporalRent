import { Router } from 'express';
import { authenticate as requireAuth } from '../../middleware/authenticate';
import { DispatchController } from './dispatch.controller';

const router = Router();
const controller = new DispatchController();

router.get('/', requireAuth, controller.list.bind(controller));
router.get('/:id', requireAuth, controller.getById.bind(controller));

export default router;
