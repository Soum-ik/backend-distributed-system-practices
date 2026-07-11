# backend-distributed-system-practices

Project instructions live in [.claude/CLAUDE.md](.claude/CLAUDE.md) — the canonical, optimized guide (Bun runtime + Express, feature-based modular architecture, commands, and conventions).

TL;DR:
- **Runtime/toolchain:** Bun (`bun run dev` / `bun test` / `bun install`). No npm/node/dotenv.
- **Framework:** Express 5, TypeScript ESM strict.
- **Structure:** feature modules under `src/modules/<feature>/` (routes → controller → service + test); shared `config`/`middlewares`/`utils`.
