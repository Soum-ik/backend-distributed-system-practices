import { describe, expect, it } from 'bun:test';
import { assertDistinct } from './follows.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('follows.service assertDistinct', () => {
  it('allows distinct users', () => {
    expect(() => assertDistinct('1', '2')).not.toThrow();
  });

  it('rejects self-follow', () => {
    expect(() => assertDistinct('1', '1')).toThrow(AppError);
  });

  it('rejects missing ids', () => {
    expect(() => assertDistinct('', '2')).toThrow(AppError);
    expect(() => assertDistinct('1', '')).toThrow(AppError);
  });
});
