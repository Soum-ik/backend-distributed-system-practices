#!/usr/bin/env bun
/// <reference types="bun" />
import { closeDb } from '../src/db/client.ts';
import { down, status, up } from '../src/db/migrator.ts';

const command = process.argv[2];

async function main() {
  switch (command) {
    case 'up': {
      const ran = await up();
      if (ran.length === 0) console.log('Already up to date — no pending migrations.');
      else ran.forEach((v) => console.log(`↑ applied ${v}`));
      break;
    }
    case 'down': {
      const rolledBack = await down();
      if (rolledBack) console.log(`↓ rolled back ${rolledBack}`);
      else console.log('Nothing to roll back.');
      break;
    }
    case 'status': {
      const rows = await status();
      if (rows.length === 0) {
        console.log('No migrations found in ./migrations');
        break;
      }
      for (const r of rows) {
        console.log(`${r.applied ? '[x]' : '[ ]'} ${r.version}`);
      }
      break;
    }
    default:
      console.error('Usage: bun run scripts/migrate.ts <up|down|status>');
      process.exit(1);
  }
}

try {
  await main();
} catch (err) {
  console.error('Migration failed:', err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  await closeDb();
}
