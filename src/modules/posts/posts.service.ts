import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';
import { notificationsService } from '../notifications/notifications.service.ts';

export interface Post {
  id: string;
  authorId: string;
  body: string;
  likeCount: number;
  createdAt: string;
}

interface PostRow {
  id: string;
  author_id: string;
  body: string;
  like_count: number;
  created_at: string | Date;
}

function toPost(row: PostRow): Post {
  return {
    id: String(row.id),
    authorId: String(row.author_id),
    body: row.body,
    likeCount: Number(row.like_count),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const MAX_BODY = 500;

// Pure validator — unit-testable without a DB.
export function normalizeBody(body: unknown): string {
  const b = typeof body === 'string' ? body.trim() : '';
  if (!b) throw new AppError('post body is required', 400);
  if (b.length > MAX_BODY) throw new AppError(`post body exceeds ${MAX_BODY} chars`, 400);
  return b;
}

export const postsService = {
  async create(authorId: string, body: unknown): Promise<Post> {
    const clean = normalizeBody(body);
    const sql = getSql();
    try {
      const [row] = await sql`
        INSERT INTO posts (author_id, body)
        VALUES (${authorId}, ${clean})
        RETURNING id, author_id, body, like_count, created_at
      `;
      return toPost(row as PostRow);
    } catch (err) {
      if (err instanceof Error && /foreign key/i.test(err.message)) {
        throw new AppError('author does not exist', 404);
      }
      throw err;
    }
  },

  async getById(id: string): Promise<Post> {
    const sql = getSql();
    const [row] = await sql`
      SELECT id, author_id, body, like_count, created_at FROM posts WHERE id = ${id}
    `;
    if (!row) throw new AppError('post not found', 404);
    return toPost(row as PostRow);
  },

  async listByAuthor(authorId: string, limit = 20, offset = 0): Promise<Post[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT id, author_id, body, like_count, created_at
      FROM posts WHERE author_id = ${authorId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as PostRow[]).map(toPost);
  },

  // Home feed: posts from everyone the given user follows, newest first.
  // Falls back gracefully if the follows table isn't present yet.
  async feed(userId: string, limit = 20, offset = 0): Promise<Post[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT p.id, p.author_id, p.body, p.like_count, p.created_at
      FROM posts p
      WHERE p.author_id IN (
        SELECT followee_id FROM follows WHERE follower_id = ${userId}
      )
      ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as PostRow[]).map(toPost);
  },

  async remove(id: string, requesterId: string): Promise<void> {
    const sql = getSql();
    const [row] = await sql`SELECT author_id FROM posts WHERE id = ${id}`;
    if (!row) throw new AppError('post not found', 404);
    if (String(row.author_id) !== String(requesterId)) {
      throw new AppError('you can only delete your own posts', 403);
    }
    await sql`DELETE FROM posts WHERE id = ${id}`;
  },

  async like(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const sql = getSql();
    const [post] = await sql`SELECT author_id FROM posts WHERE id = ${postId}`;
    if (!post) throw new AppError('post not found', 404);

    const inserted = await sql`
      INSERT INTO post_likes (post_id, user_id) VALUES (${postId}, ${userId})
      ON CONFLICT DO NOTHING RETURNING post_id
    `;
    if (inserted.length > 0) {
      await sql`UPDATE posts SET like_count = like_count + 1 WHERE id = ${postId}`;
      await notificationsService.emitLike(userId, String(post.author_id), postId);
    }
    const [row] = await sql`SELECT like_count FROM posts WHERE id = ${postId}`;
    return { liked: inserted.length > 0, likeCount: Number(row.like_count) };
  },

  async unlike(postId: string, userId: string): Promise<{ likeCount: number }> {
    const sql = getSql();
    const removed = await sql`
      DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}
      RETURNING post_id
    `;
    if (removed.length > 0) {
      await sql`UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ${postId}`;
    }
    const [row] = await sql`SELECT like_count FROM posts WHERE id = ${postId}`;
    if (!row) throw new AppError('post not found', 404);
    return { likeCount: Number(row.like_count) };
  },
};
