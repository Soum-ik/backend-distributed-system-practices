import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.ts';
import { logger } from '../utils/logger.ts';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = performance.now();

  if (!env.isProduction) {
    process.stderr.write(`--> ${req.method} ${req.originalUrl}\n`);
  }

  res.on('finish', () => {
    const durationMs = Math.round(performance.now() - start);
    const meta = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    };

    if (env.isProduction) {
      logger.info('request', meta);
      return;
    }

    process.stderr.write(`<-- ${meta.method} ${meta.url} ${meta.status} ${meta.durationMs}ms\n`);
  });
  next();
}
