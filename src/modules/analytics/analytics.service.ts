import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';

export interface TrackEventInput {
  userId?: string | null;
  eventType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEvent {
  id: string;
  userId: string | null;
  eventType: string;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface Overview {
  totalUsers: number;
  totalPosts: number;
  totalFollows: number;
  totalLikes: number;
}

// Pure validator — event types are lowercase dotted slugs, e.g. "post.view".
const EVENT_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;

export function normalizeEventType(raw: unknown): string {
  const t = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  if (!t || t.length > 60 || !EVENT_RE.test(t)) {
    throw new AppError('eventType must be a dotted slug like "post.view"', 400);
  }
  return t;
}

export function clampDays(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return 7;
  return Math.min(Math.floor(n), 365);
}

export const analyticsService = {
  async track(input: TrackEventInput): Promise<AnalyticsEvent> {
    const eventType = normalizeEventType(input.eventType);
    const sql = getSql();
    const [row] = await sql`
      INSERT INTO analytics_events (user_id, event_type, entity_id, metadata)
      VALUES (
        ${input.userId ?? null},
        ${eventType},
        ${input.entityId ?? null},
        ${JSON.stringify(input.metadata ?? {})}::jsonb
      )
      RETURNING id, user_id, event_type, entity_id, metadata, created_at
    `;
    return {
      id: String(row.id),
      userId: row.user_id == null ? null : String(row.user_id),
      eventType: row.event_type,
      entityId: row.entity_id == null ? null : String(row.entity_id),
      metadata: row.metadata,
      createdAt: new Date(row.created_at).toISOString(),
    };
  },

  // Platform-wide totals across the social graph.
  async overview(): Promise<Overview> {
    const sql = getSql();
    const [row] = await sql`
      SELECT
        (SELECT COUNT(*) FROM users)   AS total_users,
        (SELECT COUNT(*) FROM posts)   AS total_posts,
        (SELECT COUNT(*) FROM follows) AS total_follows,
        (SELECT COALESCE(SUM(like_count), 0) FROM posts) AS total_likes
    `;
    return {
      totalUsers: Number(row.total_users),
      totalPosts: Number(row.total_posts),
      totalFollows: Number(row.total_follows),
      totalLikes: Number(row.total_likes),
    };
  },

  // Daily event counts for a given event type over the last N days.
  async eventTimeseries(
    rawEventType: unknown,
    rawDays: unknown,
  ): Promise<Array<{ day: string; count: number }>> {
    const eventType = normalizeEventType(rawEventType);
    const days = clampDays(rawDays);
    const sql = getSql();
    const rows = await sql`
      SELECT date_trunc('day', created_at)::date AS day, COUNT(*) AS count
      FROM analytics_events
      WHERE event_type = ${eventType}
        AND created_at >= now() - (${days} || ' days')::interval
      GROUP BY 1 ORDER BY 1
    `;
    return rows.map((r: any) => ({
      day: new Date(r.day).toISOString().slice(0, 10),
      count: Number(r.count),
    }));
  },

  // Top authors by post count with total likes received.
  async topAuthors(limit = 10): Promise<Array<{ authorId: string; posts: number; likes: number }>> {
    const sql = getSql();
    const rows = await sql`
      SELECT author_id, COUNT(*) AS posts, COALESCE(SUM(like_count), 0) AS likes
      FROM posts GROUP BY author_id
      ORDER BY likes DESC, posts DESC LIMIT ${Math.min(limit, 100)}
    `;
    return rows.map((r: any) => ({
      authorId: String(r.author_id),
      posts: Number(r.posts),
      likes: Number(r.likes),
    }));
  },
};
