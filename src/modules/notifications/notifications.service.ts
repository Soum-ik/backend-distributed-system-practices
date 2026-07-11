import { getSql } from '../../db/client.ts';
import { AppError } from '../../utils/AppError.ts';

export const NOTIFICATION_TYPES = ['follow', 'like', 'mention', 'reply'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  id: string;
  recipientId: string;
  actorId: string | null;
  type: NotificationType;
  entityId: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  recipientId: string;
  actorId?: string | null;
  type: NotificationType;
  entityId?: string | null;
}

interface NotificationRow {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  entity_id: string | null;
  read_at: string | Date | null;
  created_at: string | Date;
}

function toNotification(row: NotificationRow): Notification {
  return {
    id: String(row.id),
    recipientId: String(row.recipient_id),
    actorId: row.actor_id == null ? null : String(row.actor_id),
    type: row.type,
    entityId: row.entity_id == null ? null : String(row.entity_id),
    readAt: row.read_at ? new Date(row.read_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

// Pure validator — testable without a DB.
export function assertType(type: unknown): NotificationType {
  if (typeof type !== 'string' || !NOTIFICATION_TYPES.includes(type as NotificationType)) {
    throw new AppError(
      `type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      400,
    );
  }
  return type as NotificationType;
}

export const notificationsService = {
  async emitFollow(actorId: string, recipientId: string): Promise<void> {
    try {
      await this.create({ recipientId, actorId, type: 'follow' });
    } catch {
      // Notification delivery must not block the primary action.
    }
  },

  async emitLike(actorId: string, recipientId: string, postId: string): Promise<void> {
    try {
      await this.create({ recipientId, actorId, type: 'like', entityId: postId });
    } catch {
      // Notification delivery must not block the primary action.
    }
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const type = assertType(input.type);
    if (!input.recipientId) throw new AppError('recipientId is required', 400);
    // Don't notify a user about their own action.
    if (input.actorId && String(input.actorId) === String(input.recipientId)) {
      // no-op self notifications; return a synthetic silent record is overkill,
      // so we just skip by throwing a soft 400 the caller can ignore.
      throw new AppError('actor and recipient are the same; skipped', 400);
    }
    const sql = getSql();
    const [row] = await sql`
      INSERT INTO notifications (recipient_id, actor_id, type, entity_id)
      VALUES (${input.recipientId}, ${input.actorId ?? null}, ${type}, ${input.entityId ?? null})
      RETURNING id, recipient_id, actor_id, type, entity_id, read_at, created_at
    `;
    return toNotification(row as NotificationRow);
  },

  async list(
    recipientId: string,
    opts: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
  ): Promise<Notification[]> {
    const { unreadOnly = false, limit = 20, offset = 0 } = opts;
    const sql = getSql();
    const rows = unreadOnly
      ? await sql`
          SELECT id, recipient_id, actor_id, type, entity_id, read_at, created_at
          FROM notifications
          WHERE recipient_id = ${recipientId} AND read_at IS NULL
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `
      : await sql`
          SELECT id, recipient_id, actor_id, type, entity_id, read_at, created_at
          FROM notifications
          WHERE recipient_id = ${recipientId}
          ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
        `;
    return (rows as NotificationRow[]).map(toNotification);
  },

  async unreadCount(recipientId: string): Promise<number> {
    const sql = getSql();
    const [row] = await sql`
      SELECT COUNT(*) AS count FROM notifications
      WHERE recipient_id = ${recipientId} AND read_at IS NULL
    `;
    return Number(row.count);
  },

  async markRead(id: string, recipientId: string): Promise<Notification> {
    const sql = getSql();
    const [row] = await sql`
      UPDATE notifications SET read_at = COALESCE(read_at, now())
      WHERE id = ${id} AND recipient_id = ${recipientId}
      RETURNING id, recipient_id, actor_id, type, entity_id, read_at, created_at
    `;
    if (!row) throw new AppError('notification not found', 404);
    return toNotification(row as NotificationRow);
  },

  async markAllRead(recipientId: string): Promise<{ updated: number }> {
    const sql = getSql();
    const rows = await sql`
      UPDATE notifications SET read_at = now()
      WHERE recipient_id = ${recipientId} AND read_at IS NULL
      RETURNING id
    `;
    return { updated: rows.length };
  },
};
