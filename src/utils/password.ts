import { AppError } from './AppError.ts';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

export function normalizePassword(password: unknown): string {
  const p = typeof password === 'string' ? password : '';
  if (p.length < MIN_PASSWORD) {
    throw new AppError(`password must be at least ${MIN_PASSWORD} characters`, 400);
  }
  if (p.length > MAX_PASSWORD) {
    throw new AppError(`password must be at most ${MAX_PASSWORD} characters`, 400);
  }
  return p;
}

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
