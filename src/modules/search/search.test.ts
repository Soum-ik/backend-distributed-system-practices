import { describe, expect, it } from 'bun:test';
import { normalizeQuery } from './search.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('search.service normalizeQuery', () => {
  it('trims valid queries', () => {
    expect(normalizeQuery('  hello ')).toBe('hello');
  });

  it('rejects queries shorter than 2 chars', () => {
    for (const bad of ['', ' ', 'a', ' a ', null, 42]) {
      expect(() => normalizeQuery(bad)).toThrow(AppError);
    }
  });

  it('rejects queries over 100 chars', () => {
    expect(() => normalizeQuery('x'.repeat(101))).toThrow(AppError);
  });
});
