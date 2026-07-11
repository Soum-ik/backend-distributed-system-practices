import type { Request, Response } from 'express';
import { postsService } from './posts.service.ts';
import { getUserId } from '../../middlewares/authenticate.ts';

export const postsController = {
  async create(req: Request, res: Response) {
    const authorId = getUserId(req);
    res.status(201).json(await postsService.create(authorId, req.body?.body));
  },

  async getById(req: Request, res: Response) {
    res.json(await postsService.getById(String(req.params.id)));
  },

  async listByAuthor(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    res.json(await postsService.listByAuthor(String(req.params.authorId), limit, offset));
  },

  async feed(req: Request, res: Response) {
    const userId = getUserId(req);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    res.json(await postsService.feed(userId, limit, offset));
  },

  async remove(req: Request, res: Response) {
    await postsService.remove(String(req.params.id), getUserId(req));
    res.status(204).end();
  },

  async like(req: Request, res: Response) {
    res.json(await postsService.like(String(req.params.id), getUserId(req)));
  },

  async unlike(req: Request, res: Response) {
    res.json(await postsService.unlike(String(req.params.id), getUserId(req)));
  },
};
