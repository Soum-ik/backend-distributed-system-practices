import type { Request, Response } from 'express';
import { followsService } from './follows.service.ts';
import { getUserId } from '../../middlewares/authenticate.ts';

function pagination(req: Request) {
  return {
    limit: Math.min(Number(req.query.limit) || 20, 100),
    offset: Number(req.query.offset) || 0,
  };
}

export const followsController = {
  async follow(req: Request, res: Response) {
    const followerId = getUserId(req);
    res.status(201).json(await followsService.follow(followerId, String(req.params.id)));
  },

  async unfollow(req: Request, res: Response) {
    const followerId = getUserId(req);
    res.json(await followsService.unfollow(followerId, String(req.params.id)));
  },

  async followers(req: Request, res: Response) {
    const { limit, offset } = pagination(req);
    res.json(await followsService.followers(String(req.params.id), limit, offset));
  },

  async following(req: Request, res: Response) {
    const { limit, offset } = pagination(req);
    res.json(await followsService.following(String(req.params.id), limit, offset));
  },

  async counts(req: Request, res: Response) {
    res.json(await followsService.counts(String(req.params.id)));
  },
};
