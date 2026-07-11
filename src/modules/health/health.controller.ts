import type { Request, Response } from 'express';
import { healthService } from './health.service.ts';

export const healthController = {
  getHealth(_req: Request, res: Response) {
    res.status(200).json(healthService.check());
  },
};
