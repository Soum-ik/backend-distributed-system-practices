import { describe, expect, it } from 'bun:test';
import { assertType, NOTIFICATION_TYPES } from './notifications.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('notifications.service assertType', () => {
  it('accepts every known type', () => {
    for (const t of NOTIFICATION_TYPES) {
      expect(assertType(t)).toBe(t);
    }
  });

  it('rejects unknown or non-string types', () => {
    for (const bad of ['unknown', '', null, 42, undefined]) {
      expect(() => assertType(bad)).toThrow(AppError);
    }
  });
});
