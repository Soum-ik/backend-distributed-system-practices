import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';

export interface UserHit {
  kind: 'user';
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PostHit {
  kind: 'post';
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface SearchResults {
  users: UserHit[];
  posts: PostHit[];
}

// Pure query sanitizer — trims, enforces min length, caps length.
// Testable without a DB.
export function normalizeQuery(raw: unknown): string {
  const q = typeof raw === 'string' ? raw.trim() : '';
  if (q.length < 2) throw new AppError('search query must be at least 2 characters', 400);
  if (q.length > 100) throw new AppError('search query too long (max 100)', 400);
  return q;
}

export const searchService = {
  async users(raw: unknown, limit = 20): Promise<UserHit[]> {
    const q = normalizeQuery(raw);
    const sql = getSql();
    // Trigram similarity ranking against username and name.
    const rows = await sql`
      SELECT id, username, name, avatar_url
      FROM users
      WHERE username ILIKE ${'%' + q + '%'} OR name ILIKE ${'%' + q + '%'}
      ORDER BY GREATEST(
        similarity(username, ${q}),
        similarity(COALESCE(name, ''), ${q})
      ) DESC
      LIMIT ${limit}
    `;
    return rows.map((r: any) => ({
      kind: 'user' as const,
      id: String(r.id),
      username: r.username,
      name: r.name,
      avatarUrl: r.avatar_url,
    }));
  },

  async posts(raw: unknown, limit = 20): Promise<PostHit[]> {
    const q = normalizeQuery(raw);
    const sql = getSql();
    // websearch_to_tsquery handles user-friendly query syntax safely.
    const rows = await sql`
      SELECT id, author_id, body, created_at
      FROM posts
      WHERE body_tsv @@ websearch_to_tsquery('english', ${q})
      ORDER BY ts_rank(body_tsv, websearch_to_tsquery('english', ${q})) DESC,
               created_at DESC
      LIMIT ${limit}
    `;
    return rows.map((r: any) => ({
      kind: 'post' as const,
      id: String(r.id),
      authorId: String(r.author_id),
      body: r.body,
      createdAt: new Date(r.created_at).toISOString(),
    }));
  },

  async all(raw: unknown, limit = 20): Promise<SearchResults> {
    const [users, posts] = await Promise.all([
      this.users(raw, limit),
      this.posts(raw, limit),
    ]);
    return { users, posts };
  },
};
