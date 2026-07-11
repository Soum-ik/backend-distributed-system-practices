#!/usr/bin/env bun
/// <reference types="bun" />
import { join } from 'node:path';

const rawName = process.argv[2];
if (!rawName) {
  console.error('Usage: bun run scripts/new-migration.ts <name>');
  process.exit(1);
}

// Normalize the name: lowercase, non-alphanumerics → underscores.
const name = rawName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

// Timestamp prefix (YYYYMMDDHHmmss) so files sort chronologically.
const now = new Date();
const pad = (n: number) => String(n).padStart(2, '0');
const timestamp =
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
  `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;

const filename = `${timestamp}_${name}.sql`;
const path = join(process.cwd(), 'migrations', filename);

const template = `-- Migration: ${name}
-- Created: ${now.toISOString()}

-- migrate:up


-- migrate:down

`;

await Bun.write(path, template);
console.log(`Created migrations/${filename}`);
