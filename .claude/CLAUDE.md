# Project instructions

Backend for practicing distributed-systems patterns. **Bun** runtime + **Express 5** HTTP framework, **TypeScript** (ESM, strict).

## Runtime & toolchain — use Bun

- `bun <file>` — never `node` / `ts-node`
- `bun test` — never jest / vitest
- `bun install` / `bun run <script>` — never npm / yarn / pnpm
- Bun auto-loads `.env` — no `dotenv`. Read env via `Bun.env`.
- Prefer Bun built-ins over npm libs: `bun:sqlite` (not better-sqlite3), `Bun.redis` (not ioredis), `Bun.sql` (not pg/postgres.js), `Bun.file` (not node:fs read/write), `` Bun.$`…` `` (not execa), built-in `WebSocket` (not ws).

## HTTP framework — Express

Express 5 is the chosen HTTP framework for this project (the Bun-starter "don't use express" default does **not** apply here). Keep Bun as the runtime/toolchain above; use Express for routing/middleware.

## Commands

- `bun run dev` — hot-reload server (`bun --hot src/server.ts`)
- `bun run start` — run server
- `bun test` — run tests

## Architecture — feature-based modular

```
src/
├── modules/<feature>/   # self-contained vertical slice
│   ├── <feature>.routes.ts       # Router: path → controller
│   ├── <feature>.controller.ts   # HTTP layer (req/res only)
│   ├── <feature>.service.ts      # business logic (no Express types)
│   └── <feature>.test.ts         # bun:test, tests the service
├── config/env.ts        # shared config from Bun.env
├── middlewares/         # shared: errorHandler, requestLogger
├── utils/               # shared: logger, AppError, asyncHandler
├── routes/index.ts      # mounts every module under /api
├── app.ts               # assembles Express app + middleware order
└── server.ts            # listen + graceful shutdown
```

Reference module: `src/modules/health/`.

### Rules

- **Layer discipline:** controllers handle req/res only; all logic lives in services. Services must not import Express types (keeps them unit-testable).
- **Errors:** throw `AppError(message, statusCode)` from services. Wrap async controllers in `asyncHandler(...)` so rejections reach the central `errorHandler`. Never `res.status(500)` by hand.
- **Logging:** use `logger` from `utils/logger.ts` (structured JSON) — not `console.*`.
- **Imports:** explicit `.ts` extensions (`allowImportingTsExtensions`), ESM only, `verbatimModuleSyntax` — use `import type` for type-only imports.
- **Tests:** `bun:test`, colocated as `<feature>.test.ts` inside the module. Test services, not controllers.

### Adding a feature

1. `src/modules/<name>/` with `.routes.ts`, `.controller.ts`, `.service.ts`, `.test.ts` (copy `health/`).
2. Register one line in `src/routes/index.ts`: `router.use('/<name>', <name>Routes)`.

## Conventions

- Keep new code consistent with the existing module's style and layering.
- Distributed-systems concerns worth adding as the project grows: request/correlation IDs, graceful shutdown hooks for DB/Redis, rate limiting, config validation.
