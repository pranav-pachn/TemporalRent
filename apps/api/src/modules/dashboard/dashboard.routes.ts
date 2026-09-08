import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { DashboardController } from './dashboard.controller';

const router = Router();
const controller = new DashboardController();

router.get('/', authenticate, controller.getDashboard.bind(controller));

export default router;
