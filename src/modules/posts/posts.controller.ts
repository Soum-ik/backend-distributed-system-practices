import type { Request, Response } from 'express';
import { postsService } from './posts.service.ts';
import { AppError } from '../../utils/AppError.ts';

// The feed has no auth layer yet; the acting user is passed explicitly.
function requireActor(req: Request): string {
  const id = req.body?.userId ?? req.query.userId ?? req.header('x-user-id');
  if (!id) throw new AppError('userId is required (body, query, or x-user-id header)', 400);
  return String(id);
}

export const postsController = {
  async create(req: Request, res: Response) {
    const authorId = requireActor(req);
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
    const userId = requireActor(req);
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    res.json(await postsService.feed(userId, limit, offset));
  },

  async remove(req: Request, res: Response) {
    await postsService.remove(String(req.params.id), requireActor(req));
    res.status(204).end();
  },

  async like(req: Request, res: Response) {
    res.json(await postsService.like(String(req.params.id), requireActor(req)));
  },

  async unlike(req: Request, res: Response) {
    res.json(await postsService.unlike(String(req.params.id), requireActor(req)));
  },
};
