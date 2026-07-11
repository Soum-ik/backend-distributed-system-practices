import type { Request, Response } from 'express';
import { notificationsService } from './notifications.service.ts';
import { AppError } from '../../utils/AppError.ts';

function requireActor(req: Request): string {
  const id = req.query.userId ?? req.body?.userId ?? req.header('x-user-id');
  if (!id) throw new AppError('userId is required (query, body, or x-user-id header)', 400);
  return String(id);
}

export const notificationsController = {
  async create(req: Request, res: Response) {
    res.status(201).json(await notificationsService.create(req.body ?? {}));
  },

  async list(req: Request, res: Response) {
    const recipientId = requireActor(req);
    res.json(
      await notificationsService.list(recipientId, {
        unreadOnly: req.query.unread === 'true',
        limit: Math.min(Number(req.query.limit) || 20, 100),
        offset: Number(req.query.offset) || 0,
      }),
    );
  },

  async unreadCount(req: Request, res: Response) {
    res.json({ unread: await notificationsService.unreadCount(requireActor(req)) });
  },

  async markRead(req: Request, res: Response) {
    res.json(await notificationsService.markRead(String(req.params.id), requireActor(req)));
  },

  async markAllRead(req: Request, res: Response) {
    res.json(await notificationsService.markAllRead(requireActor(req)));
  },
};
