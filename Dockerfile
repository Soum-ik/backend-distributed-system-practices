# syntax=docker/dockerfile:1

# ---- Base ----
FROM oven/bun:1.3-slim AS base
WORKDIR /app

# ---- Dependencies (cached layer) ----
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

# The oven/bun image ships a non-root `bun` user.
COPY --from=deps --chown=bun:bun /app/node_modules ./node_modules
COPY --chown=bun:bun . .

USER bun
EXPOSE 3000

# Basic liveness check against the health endpoint.
# HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
#   CMD bun --eval "await fetch('http://localhost:' + (Bun.env.PORT ?? 3000) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["bun", "src/server.ts"]
