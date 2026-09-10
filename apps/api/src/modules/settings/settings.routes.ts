import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { SettingsController } from './settings.controller';

const router = Router();
const controller = new SettingsController();

router.use(authenticate);

router.get('/business', controller.getBusinessSettings.bind(controller));
router.patch('/business', controller.updateBusinessSettings.bind(controller));

export const settingsRouter = router;
