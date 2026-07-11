import { env } from '../config/env.ts';

export interface HealthStatus {
  status: 'ok';
  uptimeSeconds: number;
  environment: string;
  timestamp: string;
}

export const healthService = {
  check(): HealthStatus {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      environment: env.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  },
};
