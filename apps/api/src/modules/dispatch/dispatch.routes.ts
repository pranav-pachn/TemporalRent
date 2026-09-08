import { Router } from 'express';
import { authenticate as requireAuth } from '../../middleware/authenticate';
import { DispatchController } from './dispatch.controller';

const router = Router({ mergeParams: true });
const controller = new DispatchController();

// Note: In TemporalRent, these routes are typically nested under /bookings/:id/dispatch
// For example: app.use('/api/v1/bookings/:id/dispatch', dispatchRoutes);

router.get('/', requireAuth, controller.getByBookingId.bind(controller));
router.post('/prepare', requireAuth, controller.prepare.bind(controller));
router.post('/start-picking', requireAuth, controller.startPicking.bind(controller));
router.post('/confirm', requireAuth, controller.confirm.bind(controller));

export default router;
