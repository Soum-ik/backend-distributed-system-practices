import { describe, expect, it } from 'bun:test';
import { normalizePassword } from '../../utils/password.ts';
import { signToken, verifyToken } from '../../utils/jwt.ts';
import { AppError } from '../../utils/AppError.ts';

describe('password utils', () => {
  it('accepts passwords within length bounds', () => {
    expect(normalizePassword('12345678')).toBe('12345678');
  });

  it('rejects short or non-string passwords', () => {
    for (const bad of ['', 'short', 123, null]) {
      expect(() => normalizePassword(bad)).toThrow(AppError);
    }
  });
});

describe('jwt utils', () => {
  it('round-trips a user id', async () => {
    const token = await signToken('42');
    await expect(verifyToken(token)).resolves.toBe('42');
  });

  it('rejects malformed tokens', async () => {
    await expect(verifyToken('not-a-jwt')).rejects.toThrow(AppError);
  });
});
