import { Router } from 'express';
import { notificationsController } from './notifications.controller.ts';
import { asyncHandler } from '../../utils/asyncHandler.ts';

const router = Router();

router.post('/', asyncHandler(notificationsController.create));
router.get('/', asyncHandler(notificationsController.list));
router.get('/unread-count', asyncHandler(notificationsController.unreadCount));
router.post('/read-all', asyncHandler(notificationsController.markAllRead));
router.post('/:id/read', asyncHandler(notificationsController.markRead));

export default router;
