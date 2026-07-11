import { Router } from 'express';
import healthRoutes from '../modules/health/health.routes.ts';
import usersRoutes from '../modules/users/users.routes.ts';
import postsRoutes from '../modules/posts/posts.routes.ts';
import followsRoutes from '../modules/follows/follows.routes.ts';
import notificationsRoutes from '../modules/notifications/notifications.routes.ts';
import searchRoutes from '../modules/search/search.routes.ts';
import analyticsRoutes from '../modules/analytics/analytics.routes.ts';

const router = Router();

// Register feature modules here.
router.use('/health', healthRoutes);
router.use('/users', usersRoutes);
router.use('/posts', postsRoutes);
// Follow graph endpoints hang off individual users: /users/:id/follow, etc.
router.use('/users', followsRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/search', searchRoutes);
router.use('/analytics', analyticsRoutes);

export default router;
