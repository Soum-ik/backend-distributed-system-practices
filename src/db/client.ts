/// <reference types="bun" />
import { SQL } from 'bun';

// Lazily-created Postgres connection pool. We defer connecting until the
// first query so modules that only use pure helpers (e.g. the migration
// parser) can be imported without a live DATABASE_URL.
let _sql: SQL | undefined;

export function getSql(): SQL {
  if (!_sql) {
    const databaseUrl = Bun.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL is not set. Set it in .env (see .env.example) before using the database.',
      );
    }
    _sql = new SQL(databaseUrl);
  }
  return _sql;
}

export async function closeDb(): Promise<void> {
  if (_sql) {
    await _sql.close();
    _sql = undefined;
  }
}
