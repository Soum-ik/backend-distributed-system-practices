import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.ts';
import usersRoutes from '../modules/users/users.routes.ts';

const router = Router();

// Register feature modules here.
router.use('/health', healthRoutes);
router.use('/users', usersRoutes);

export default router;
