import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';
import { hashPassword, normalizePassword } from '../../utils/password.ts';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface UpdateUserInput {
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

// Row → API shape. Bun.sql returns snake_case columns.
interface UserRow {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | Date;
}

function toUser(row: UserRow): User {
  return {
    id: String(row.id),
    email: row.email,
    username: row.username,
    name: row.name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-z0-9_]{3,30}$/;

// Pure validators — exported so they can be unit-tested without a DB.
export function normalizeEmail(email: string): string {
  const e = email?.trim().toLowerCase() ?? '';
  if (!EMAIL_RE.test(e)) throw new AppError('A valid email is required', 400);
  return e;
}

export function normalizeUsername(username: string): string {
  const u = username?.trim().toLowerCase() ?? '';
  if (!USERNAME_RE.test(u)) {
    throw new AppError('username must be 3-30 chars: a-z, 0-9, underscore', 400);
  }
  return u;
}

export const usersService = {
  async create(input: CreateUserInput): Promise<User> {
    const email = normalizeEmail(input.email);
    const username = normalizeUsername(input.username);
    const passwordHash = await hashPassword(normalizePassword(input.password));

    const sql = getSql();
    try {
      const [row] = await sql`
        INSERT INTO users (email, username, name, bio, avatar_url, password_hash)
        VALUES (${email}, ${username}, ${input.name ?? null}, ${input.bio ?? null}, ${input.avatarUrl ?? null}, ${passwordHash})
        RETURNING id, email, username, name, bio, avatar_url, created_at
      `;
      return toUser(row as UserRow);
    } catch (err) {
      if (err instanceof Error && /unique/i.test(err.message)) {
        throw new AppError('email or username already taken', 409);
      }
      throw err;
    }
  },

  async getById(id: string): Promise<User> {
    const sql = getSql();
    const [row] = await sql`
      SELECT id, email, username, name, bio, avatar_url, created_at
      FROM users WHERE id = ${id}
    `;
    if (!row) throw new AppError('user not found', 404);
    return toUser(row as UserRow);
  },

  async getByUsername(username: string): Promise<User> {
    const sql = getSql();
    const [row] = await sql`
      SELECT id, email, username, name, bio, avatar_url, created_at
      FROM users WHERE username = ${username.toLowerCase()}
    `;
    if (!row) throw new AppError('user not found', 404);
    return toUser(row as UserRow);
  },

  async list(limit = 20, offset = 0): Promise<User[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT id, email, username, name, bio, avatar_url, created_at
      FROM users ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as UserRow[]).map(toUser);
  },

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const sql = getSql();
    const [row] = await sql`
      UPDATE users SET
        name       = COALESCE(${input.name ?? null}, name),
        bio        = COALESCE(${input.bio ?? null}, bio),
        avatar_url = COALESCE(${input.avatarUrl ?? null}, avatar_url),
        updated_at = now()
      WHERE id = ${id}
      RETURNING id, email, username, name, bio, avatar_url, created_at
    `;
    if (!row) throw new AppError('user not found', 404);
    return toUser(row as UserRow);
  },
};
