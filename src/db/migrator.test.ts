import { test, expect } from 'bun:test';
import { parseMigration } from './migrator.ts';

test('parses up and down sections', () => {
  const m = parseMigration(
    '20260101_init.sql',
    `-- migrate:up
CREATE TABLE t (id int);
-- migrate:down
DROP TABLE t;`,
  );
  expect(m.version).toBe('20260101_init');
  expect(m.up).toBe('CREATE TABLE t (id int);');
  expect(m.down).toBe('DROP TABLE t;');
});

test('down section is optional', () => {
  const m = parseMigration('x.sql', `-- migrate:up\nSELECT 1;`);
  expect(m.up).toBe('SELECT 1;');
  expect(m.down).toBe('');
});

test('throws when up marker is missing', () => {
  expect(() => parseMigration('bad.sql', 'SELECT 1;')).toThrow('missing');
});
