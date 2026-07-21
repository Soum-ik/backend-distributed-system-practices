# backend-distributed-system-practices

A backend playground for practicing **distributed-systems** patterns — built on the [Bun](https://bun.com) runtime with **Express 5** and **TypeScript** (ESM, strict), organized as a **feature-based modular architecture**.

## Tech stack

| Concern       | Choice                                    |
| ------------- | ----------------------------------------- |
| Runtime       | Bun                                       |
| Framework     | Express 5                                 |
| Language      | TypeScript (ESM, strict)                  |
| Testing       | `bun:test`                                |
| Structure     | Feature modules (`src/modules/<feature>`) |

## Getting started

```bash
bun install       # install dependencies
bun run dev       # start with hot reload (http://localhost:3000)
```

Then hit the health endpoint:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","uptimeSeconds":1,"environment":"development","timestamp":"..."}
```

### Scripts

| Command         | Description                          |
| --------------- | ------------------------------------ |
| `bun run dev`   | Start the server with hot reload     |
| `bun run start` | Start the server (no watch)          |
| `bun test`      | Run the test suite                   |

### Environment

Bun auto-loads `.env` (no `dotenv` needed):

| Variable   | Default       | Description                              |
| ---------- | ------------- | ---------------------------------------- |
| `PORT`     | `3000`        | Port the HTTP server listens on          |
| `NODE_ENV` | `development` | `development` \| `production`            |
| `LB_PORT`  | `8080`        | Host port the Nginx load balancer exposes |

## Running with Docker & load balancing

An Nginx edge load balancer fronts N replicas of the `app` service. Only the
load balancer is exposed to the host (`:8080`); the app replicas share port
3000 internally and are reached **only** through it.

```
host :8080 ──▶ lb (nginx) ──▶ app ×N ──▶ postgres
```

```bash
# Build + start with 3 app replicas behind the LB
docker compose up -d --build --scale app=3

# Every response carries an X-Upstream header showing which backend answered
curl -i http://localhost:8080/api/health

# Scale live — nginx picks up new replicas via compose DNS
docker compose up -d --scale app=5

# Tear down
docker compose down
```

See [`infra/nginx/README.md`](infra/nginx/README.md) for the balancing strategy,
failover experiments, and config walkthrough.

## Architecture

Feature-based modular layout — each feature is a self-contained vertical slice, with cross-cutting concerns kept shared.

```
src/
├── modules/                 # feature modules (vertical slices)
│   └── health/
│       ├── health.routes.ts       # Router: path → controller
│       ├── health.controller.ts   # HTTP layer (req/res only)
│       ├── health.service.ts      # business logic (no Express types)
│       └── health.test.ts         # bun:test
├── config/env.ts            # shared config from Bun.env
├── middlewares/             # shared: errorHandler, requestLogger
├── utils/                   # shared: logger, AppError, asyncHandler
├── routes/index.ts          # mounts every module under /api
├── app.ts                   # assembles the Express app
└── server.ts                # listen + graceful shutdown
```

**Request flow:** `route → controller → service`

- **Controller** — handles `req`/`res` only; no business logic.
- **Service** — pure business logic; never imports Express types, so it stays unit-testable.
- **Errors** — services throw `AppError(message, statusCode)`; async controllers are wrapped in `asyncHandler(...)` so rejections reach the centralized `errorHandler`.
- **Logging** — structured JSON via `utils/logger.ts`.
- **Shutdown** — `server.ts` drains connections on `SIGTERM`/`SIGINT`.

### Adding a feature

1. Create `src/modules/<name>/` with `.routes.ts`, `.controller.ts`, `.service.ts`, `.test.ts` (copy `health/` as a template).
2. Register it in `src/routes/index.ts`:
   ```ts
   router.use('/<name>', <name>Routes);
   ```

## API

| Method | Path          | Description               |
| ------ | ------------- | ------------------------- |
| GET    | `/api/health` | Liveness / health check   |

## Testing

```bash
bun test
```

Tests are colocated inside each module as `<feature>.test.ts` and target the service layer.

## Project conventions

Contributor and agent guidance lives in [`.claude/CLAUDE.md`](.claude/CLAUDE.md) — runtime rules, architecture, and commit conventions. A commit hook enforces [Conventional Commits](https://www.conventionalcommits.org/) style.
