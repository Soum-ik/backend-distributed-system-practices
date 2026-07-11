import { Router } from 'express';
import { notificationsController } from './notifications.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';
import { authenticate } from '../../middlewares/authenticate.ts';

const router = Router();

router.get('/', asyncHandler(authenticate), asyncHandler(notificationsController.list));
router.get('/unread-count', asyncHandler(authenticate), asyncHandler(notificationsController.unreadCount));
router.post('/read-all', asyncHandler(authenticate), asyncHandler(notificationsController.markAllRead));
router.post('/:id/read', asyncHandler(authenticate), asyncHandler(notificationsController.markRead));

export default router;
