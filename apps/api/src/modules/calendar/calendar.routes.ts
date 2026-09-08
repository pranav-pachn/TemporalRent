import { Router } from 'express';
import { CalendarController } from './calendar.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
const controller = new CalendarController();

router.get('/events', authenticate, authorize('OWNER', 'ADMIN', 'SALES', 'WAREHOUSE'), controller.getEvents);
router.get('/inventory', authenticate, authorize('OWNER', 'ADMIN', 'SALES', 'WAREHOUSE'), controller.getInventoryTimeline);

export const calendarRouter = router;
