import type { Request, Response } from 'express';
import { authService } from './auth.service.ts';
import { getUserId } from '../../middlewares/authenticate.ts';

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body ?? {});
    res.status(201).json(result);
  },

  async login(req: Request, res: Response) {
    res.json(await authService.login(req.body ?? {}));
  },

  async me(req: Request, res: Response) {
    res.json(await authService.me(getUserId(req)));
  },
};
