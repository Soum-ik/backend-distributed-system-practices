/// <reference types="bun" />
// Bun automatically loads .env, so no dotenv needed.

const DEFAULT_JWT_SECRET = 'dev-only-change-me';

export const env = {
  nodeEnv: Bun.env.NODE_ENV ?? 'development',
  port: Number(Bun.env.PORT ?? 3000),
  isProduction: (Bun.env.NODE_ENV ?? 'development') === 'production',
  jwtSecret: Bun.env.JWT_SECRET ?? DEFAULT_JWT_SECRET,
  jwtExpiresInSeconds: Number(Bun.env.JWT_EXPIRES_IN_SECONDS ?? 60 * 60 * 24 * 7),
} as const;
