import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { logger } from './utils/logger.ts';

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info('server started', { port: env.port, env: env.nodeEnv, pid: process.pid });
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.error(`port ${env.port} already in use — another server is still running`, {
      fix: `lsof -ti :${env.port} | xargs kill`,
    });
  } else {
    logger.error('server failed to start', { error: err.message });
  }
  process.exit(1);
});

// Graceful shutdown — important for distributed systems.
function shutdown(signal: string) {
  logger.warn('shutdown signal received', { signal });
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
  // Force-exit if connections don't drain in time.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
