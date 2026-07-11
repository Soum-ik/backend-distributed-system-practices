import { Router } from 'express';
import { healthController } from '../controllers/health.controller.ts';

const router = Router();

router.get('/', healthController.getHealth);

export default router;
