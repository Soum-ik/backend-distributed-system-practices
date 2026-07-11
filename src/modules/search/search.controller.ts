import type { Request, Response } from 'express';
import { searchService } from './search.service.ts';

function params(req: Request) {
  return {
    q: req.query.q,
    limit: Math.min(Number(req.query.limit) || 20, 50),
  };
}

export const searchController = {
  async all(req: Request, res: Response) {
    const { q, limit } = params(req);
    res.json(await searchService.all(q, limit));
  },

  async users(req: Request, res: Response) {
    const { q, limit } = params(req);
    res.json(await searchService.users(q, limit));
  },

  async posts(req: Request, res: Response) {
    const { q, limit } = params(req);
    res.json(await searchService.posts(q, limit));
  },
};
