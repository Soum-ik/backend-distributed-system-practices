import type { Request, Response } from 'express';
import { usersService } from './users.service.ts';

export const usersController = {
  async create(req: Request, res: Response) {
    const user = await usersService.create(req.body ?? {});
    res.status(201).json(user);
  },

  async list(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    res.json(await usersService.list(limit, offset));
  },

  async getById(req: Request, res: Response) {
    res.json(await usersService.getById(String(req.params.id)));
  },

  async getByUsername(req: Request, res: Response) {
    res.json(await usersService.getByUsername(String(req.params.username)));
  },

  async update(req: Request, res: Response) {
    res.json(await usersService.update(String(req.params.id), req.body ?? {}));
  },
};
