import { Router } from 'express';
import { authenticate as requireAuth } from '../../middleware/authenticate';
import { AuditController } from './audit.controller';

const router = Router();
const controller = new AuditController();

router.get('/', requireAuth, controller.list.bind(controller));

// We don't mount /bookings/:id/audit here. That gets mounted in bookings.routes.ts
// which delegates to the AuditController.getBookingTimeline method.

export const auditRouter = router;
export { controller as auditController };
