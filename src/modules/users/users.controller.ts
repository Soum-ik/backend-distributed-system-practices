import type { Request, Response } from 'express';
import { usersService } from './users.service.ts';
import { getUserId } from '../../middlewares/authenticate.ts';
import { AppError } from '../../utils/AppError.ts';

export const usersController = {
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
    const userId = getUserId(req);
    if (String(req.params.id) !== userId) {
      throw new AppError('you can only update your own profile', 403);
    }
    res.json(await usersService.update(userId, req.body ?? {}));
  },
};
