import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.ts';
import { getUserId } from '../../middlewares/authenticate.ts';

export const notificationsController = {
  async list(req: Request, res: Response) {
    const recipientId = getUserId(req);
    res.json(
      await notificationsService.list(recipientId, {
        unreadOnly: req.query.unread === 'true',
        limit: Math.min(Number(req.query.limit) || 20, 100),
        offset: Number(req.query.offset) || 0,
      }),
    );
  },

  async unreadCount(req: Request, res: Response) {
    res.json({ unread: await notificationsService.unreadCount(getUserId(req)) });
  },

  async markRead(req: Request, res: Response) {
    res.json(await notificationsService.markRead(String(req.params.id), getUserId(req)));
  },

  async markAllRead(req: Request, res: Response) {
    res.json(await notificationsService.markAllRead(getUserId(req)));
  },
};
