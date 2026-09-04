import { Router } from 'express';
import { BookingsController } from './bookings.controller';
import { authenticate } from '../../middleware/authenticate';

import { AdvisoryController } from '../availability/advisory.controller';

const router = Router();
const controller = new BookingsController();
const advisoryController = new AdvisoryController();

router.use(authenticate);

router.post('/:id/check-availability', (req, res) => advisoryController.checkBookingAvailability(req, res));

router.post('/', (req, res) => controller.createDraft(req, res));
router.get('/', (req, res) => controller.getList(req, res));
router.post('/:id/quote', (req, res) => controller.quote(req, res));
router.post('/:id/confirm', (req, res) => controller.confirm(req, res));
router.post('/:id/dispatch', (req, res) => controller.dispatchBooking(req, res));
router.post('/:id/return', (req, res) => controller.returnBooking(req, res));
router.post('/:id/complete', (req, res) => controller.complete(req, res));
router.post('/:id/cancel', (req, res) => controller.cancel(req, res));
router.post('/:id/reschedule', (req, res) => controller.reschedule(req, res));
router.patch('/:id', (req, res) => controller.patch(req, res));

export const bookingsRouter = router;
