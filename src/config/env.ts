// Bun automatically loads .env, so no dotenv needed.

export const env = {
  nodeEnv: Bun.env.NODE_ENV ?? 'development',
  port: Number(Bun.env.PORT ?? 3000),
  isProduction: (Bun.env.NODE_ENV ?? 'development') === 'production',
} as const;
