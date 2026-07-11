/// <reference types="bun" />
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { getSql } from './client.ts';

export const MIGRATIONS_DIR = join(process.cwd(), 'migrations');

const UP_MARKER = '-- migrate:up';
const DOWN_MARKER = '-- migrate:down';

export interface Migration {
  version: string; // filename without extension, e.g. 20260711_init
  file: string;
  up: string;
  down: string;
}

interface AppliedRow {
  version: string;
  applied_at: string;
}

// Split a migration file into its up/down sections.
export function parseMigration(file: string, contents: string): Migration {
  const upIdx = contents.indexOf(UP_MARKER);
  if (upIdx === -1) {
    throw new Error(`${file}: missing "${UP_MARKER}" section`);
  }
  const downIdx = contents.indexOf(DOWN_MARKER);

  const upBody = (downIdx === -1
    ? contents.slice(upIdx + UP_MARKER.length)
    : contents.slice(upIdx + UP_MARKER.length, downIdx)
  ).trim();

  const downBody = (downIdx === -1
    ? ''
    : contents.slice(downIdx + DOWN_MARKER.length)
  ).trim();

  return {
    version: file.replace(/\.sql$/, ''),
    file,
    up: upBody,
    down: downBody,
  };
}

export async function loadMigrations(): Promise<Migration[]> {
  let files: string[];
  try {
    files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith('.sql'));
  } catch {
    return [];
  }
  files.sort(); // timestamp prefixes sort chronologically

  const migrations: Migration[] = [];
  for (const file of files) {
    const contents = await Bun.file(join(MIGRATIONS_DIR, file)).text();
    migrations.push(parseMigration(file, contents));
  }
  return migrations;
}

// Ensure the bookkeeping table exists.
async function ensureMigrationsTable(): Promise<void> {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS _migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `;
}

async function appliedVersions(): Promise<Set<string>> {
  const sql = getSql();
  const rows = (await sql`SELECT version FROM _migrations`) as AppliedRow[];
  return new Set(rows.map((r) => r.version));
}

export interface MigrationStatus {
  version: string;
  applied: boolean;
}

export async function status(): Promise<MigrationStatus[]> {
  await ensureMigrationsTable();
  const applied = await appliedVersions();
  const migrations = await loadMigrations();
  return migrations.map((m) => ({ version: m.version, applied: applied.has(m.version) }));
}

// Apply all pending migrations, oldest first. Each runs in its own
// transaction so a failure leaves earlier migrations committed and this
// one fully rolled back.
export async function up(): Promise<string[]> {
  await ensureMigrationsTable();
  const sql = getSql();
  const applied = await appliedVersions();
  const pending = (await loadMigrations()).filter((m) => !applied.has(m.version));

  const ran: string[] = [];
  for (const m of pending) {
    if (!m.up) throw new Error(`${m.file}: empty up section`);
    await sql.begin(async (tx) => {
      await tx.unsafe(m.up);
      await tx`INSERT INTO _migrations (version) VALUES (${m.version})`;
    });
    ran.push(m.version);
  }
  return ran;
}

// Roll back the most recently applied migration.
export async function down(): Promise<string | null> {
  await ensureMigrationsTable();
  const sql = getSql();
  const rows = (await sql`
    SELECT version FROM _migrations ORDER BY version DESC LIMIT 1
  `) as AppliedRow[];
  const last = rows[0]?.version;
  if (!last) return null;

  const migration = (await loadMigrations()).find((m) => m.version === last);
  if (!migration) {
    throw new Error(`Cannot roll back ${last}: migration file is missing`);
  }
  if (!migration.down) {
    throw new Error(`Cannot roll back ${last}: no "${DOWN_MARKER}" section`);
  }

  await sql.begin(async (tx) => {
    await tx.unsafe(migration.down);
    await tx`DELETE FROM _migrations WHERE version = ${last}`;
  });
  return last;
}
