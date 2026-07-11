import { describe, expect, it } from 'bun:test';
import { normalizeEventType, clampDays } from './analytics.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('analytics.service normalizeEventType', () => {
  it('accepts dotted slugs and lowercases', () => {
    expect(normalizeEventType('Post.View')).toBe('post.view');
    expect(normalizeEventType('feed_impression')).toBe('feed_impression');
  });

  it('rejects malformed event types', () => {
    for (const bad of ['', '.leading', 'Has Space', 'a'.repeat(61), 42, null, '1bad']) {
      expect(() => normalizeEventType(bad)).toThrow(AppError);
    }
  });
});

describe('analytics.service clampDays', () => {
  it('defaults to 7 for invalid input', () => {
    for (const bad of ['', 'nope', 0, -3, null]) {
      expect(clampDays(bad)).toBe(7);
    }
  });

  it('caps at 365 and floors floats', () => {
    expect(clampDays(1000)).toBe(365);
    expect(clampDays(3.9)).toBe(3);
  });
});
