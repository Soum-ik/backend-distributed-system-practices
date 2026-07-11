import type { Request, Response } from 'express';
import { analyticsService } from './analytics.service.ts';

export const analyticsController = {
  async track(req: Request, res: Response) {
    res.status(201).json(await analyticsService.track(req.body ?? {}));
  },

  async overview(_req: Request, res: Response) {
    res.json(await analyticsService.overview());
  },

  async timeseries(req: Request, res: Response) {
    res.json(await analyticsService.eventTimeseries(req.query.eventType, req.query.days));
  },

  async topAuthors(req: Request, res: Response) {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    res.json(await analyticsService.topAuthors(limit));
  },
};
