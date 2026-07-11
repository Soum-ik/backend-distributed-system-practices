import { Router } from 'express';
import { authController } from './auth.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { authenticate } from '../../middlewares/authenticate.ts';

const router = Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.get('/me', asyncHandler(authenticate), asyncHandler(authController.me));

export default router;
