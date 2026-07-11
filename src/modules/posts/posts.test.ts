import { describe, expect, it } from 'bun:test';
import { normalizeBody } from './posts.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('posts.service normalizeBody', () => {
  it('trims and returns valid bodies', () => {
    expect(normalizeBody('  hello world ')).toBe('hello world');
  });

  it('rejects empty or whitespace-only bodies', () => {
    for (const bad of ['', '   ', null, undefined, 42]) {
      expect(() => normalizeBody(bad)).toThrow(AppError);
    }
  });

  it('rejects bodies over 500 chars', () => {
    expect(() => normalizeBody('x'.repeat(501))).toThrow(AppError);
    expect(normalizeBody('x'.repeat(500))).toHaveLength(500);
  });
});
