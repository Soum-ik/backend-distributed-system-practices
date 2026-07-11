import express from 'express';
import routes from './routes/index.ts';
import { requestLogger } from './middlewares/requestLogger.ts';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.ts';

export function createApp() {
  const app = express();

  // Core middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(requestLogger);

  // Routes
  app.use('/api', routes);

  // 404 + centralized error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
