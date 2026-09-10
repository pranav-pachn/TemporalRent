import { Router } from 'express';
import { CustomersController } from './customers.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
const controller = new CustomersController();

router.use(authenticate);

router.get('/', (req, res) => controller.getList(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.delete('/:id', (req, res) => controller.delete(req, res));

export const customersRouter = router;
