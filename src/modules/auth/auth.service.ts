import { getSql } from '../../db/client.ts';
import { usersService } from '../users/users.service.ts';
import type { User } from '../users/users.service.ts';
import { signToken } from '../../utils/jwt.ts';
import { AppError } from '../../utils/AppError.ts';
import { normalizePassword, verifyPassword } from '../../utils/password.ts';

export interface AuthResult {
  user: User;
  token: string;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
}

export interface LoginInput {
  login: string;
  password: string;
}

interface CredentialRow {
  id: string;
  email: string;
  username: string;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string | Date;
  password_hash: string | null;
  is_active: boolean;
}

function toUser(row: CredentialRow): User {
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

export const authService = {
  async register(input: RegisterInput): Promise<AuthResult> {
    const user = await usersService.create({
      email: input.email,
      username: input.username,
      password: input.password,
      name: input.name,
      bio: input.bio,
      avatarUrl: input.avatarUrl,
    });
    const token = await signToken(user.id);
    return { user, token };
  },

  async login(input: LoginInput): Promise<AuthResult> {
    const login = input.login?.trim().toLowerCase() ?? '';
    const password = normalizePassword(input.password);
    if (!login) throw new AppError('login is required', 400);

    const sql = getSql();
    const [row] = await sql`
      SELECT id, email, username, name, bio, avatar_url, created_at, password_hash, is_active
      FROM users
      WHERE email = ${login} OR username = ${login}
    `;
    if (!row) throw new AppError('invalid credentials', 401);

    const cred = row as CredentialRow;
    if (!cred.is_active) throw new AppError('account is disabled', 403);
    if (!cred.password_hash) throw new AppError('invalid credentials', 401);

    const ok = await verifyPassword(password, cred.password_hash);
    if (!ok) throw new AppError('invalid credentials', 401);

    await sql`UPDATE users SET last_login = now() WHERE id = ${cred.id}`;

    const user = toUser(cred);
    const token = await signToken(user.id);
    return { user, token };
  },

  async me(userId: string): Promise<User> {
    return usersService.getById(userId);
  },
};
