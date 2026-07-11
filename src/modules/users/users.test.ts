import { describe, expect, it } from 'bun:test';
import { normalizeEmail, normalizeUsername } from './users.service.ts';
import { AppError } from '../../utils/AppError.ts';

describe('users.service validators', () => {
  describe('normalizeEmail', () => {
    it('lowercases and trims valid emails', () => {
      expect(normalizeEmail('  Foo@Bar.COM ')).toBe('foo@bar.com');
    });

    it('rejects malformed emails', () => {
      for (const bad of ['', 'nope', 'a@b', 'a@@b.com', 'a b@c.com']) {
        expect(() => normalizeEmail(bad)).toThrow(AppError);
      }
    });
  });

  describe('normalizeUsername', () => {
    it('lowercases valid usernames', () => {
      expect(normalizeUsername('Cool_User1')).toBe('cool_user1');
    });

    it('rejects too short, too long, or illegal chars', () => {
      for (const bad of ['ab', 'a'.repeat(31), 'has space', 'dash-no', 'bang!']) {
        expect(() => normalizeUsername(bad)).toThrow(AppError);
      }
    });
  });
});
