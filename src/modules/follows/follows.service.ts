import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';
import { notificationsService } from '../notifications/notifications.service.ts';

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface UserRef {
  id: string;
  username: string;
  name: string | null;
  avatarUrl: string | null;
}

interface UserRefRow {
  id: string;
  username: string;
  name: string | null;
  avatar_url: string | null;
}

function toRef(row: UserRefRow): UserRef {
  return {
    id: String(row.id),
    username: row.username,
    name: row.name,
    avatarUrl: row.avatar_url,
  };
}

// Pure guard — a user cannot follow themselves. Testable without a DB.
export function assertDistinct(followerId: string, followeeId: string): void {
  if (!followerId || !followeeId) throw new AppError('both user ids are required', 400);
  if (String(followerId) === String(followeeId)) {
    throw new AppError('cannot follow yourself', 400);
  }
}

export const followsService = {
  async follow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    assertDistinct(followerId, followeeId);
    const sql = getSql();
    try {
      const inserted = await sql`
        INSERT INTO follows (follower_id, followee_id)
        VALUES (${followerId}, ${followeeId}) ON CONFLICT DO NOTHING RETURNING follower_id
      `;
      if (inserted.length > 0) {
        await notificationsService.emitFollow(followerId, followeeId);
      }
    } catch (err) {
      if (err instanceof Error && /foreign key/i.test(err.message)) {
        throw new AppError('user does not exist', 404);
      }
      throw err;
    }
    return { following: true };
  },

  async unfollow(followerId: string, followeeId: string): Promise<{ following: boolean }> {
    assertDistinct(followerId, followeeId);
    const sql = getSql();
    await sql`
      DELETE FROM follows WHERE follower_id = ${followerId} AND followee_id = ${followeeId}
    `;
    return { following: false };
  },

  async followers(userId: string, limit = 20, offset = 0): Promise<UserRef[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT u.id, u.username, u.name, u.avatar_url
      FROM follows f JOIN users u ON u.id = f.follower_id
      WHERE f.followee_id = ${userId}
      ORDER BY f.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as UserRefRow[]).map(toRef);
  },

  async following(userId: string, limit = 20, offset = 0): Promise<UserRef[]> {
    const sql = getSql();
    const rows = await sql`
      SELECT u.id, u.username, u.name, u.avatar_url
      FROM follows f JOIN users u ON u.id = f.followee_id
      WHERE f.follower_id = ${userId}
      ORDER BY f.created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    return (rows as UserRefRow[]).map(toRef);
  },

  async counts(userId: string): Promise<FollowCounts> {
    const sql = getSql();
    const [row] = await sql`
      SELECT
        (SELECT COUNT(*) FROM follows WHERE followee_id = ${userId}) AS followers,
        (SELECT COUNT(*) FROM follows WHERE follower_id = ${userId}) AS following
    `;
    return { followers: Number(row.followers), following: Number(row.following) };
  },
};
