import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getAuthor } from '../db.js';
import type { AppNotification, NotificationType } from '../types.js';

export const notificationsRouter = Router();
notificationsRouter.use(requireAuth);

interface NotifRow {
  id: string;
  user_id: string;
  actor_id: string;
  type: string;
  entity_id: string;
  created_at: string;
  read_at: string | null;
}

function postCover(postId: string): string {
  const row = db.prepare('SELECT image_url FROM posts WHERE id = ?').get(postId) as
    | { image_url: string }
    | undefined;
  return row?.image_url ?? '';
}

notificationsRouter.get('/', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 60')
    .all(me) as NotifRow[];

  const notifications: AppNotification[] = rows.map((r) => ({
    id: r.id,
    type: r.type as NotificationType,
    actor: getAuthor(r.actor_id),
    entityId: r.entity_id,
    preview: r.type === 'like' || r.type === 'comment' ? postCover(r.entity_id) : '',
    createdAt: r.created_at,
    read: !!r.read_at,
  }));

  // Mark everything read now that they've been delivered (clears the badge).
  db.prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(
    new Date().toISOString(),
    me,
  );

  res.json({ notifications });
});

notificationsRouter.get('/unread-count', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const { c } = db
    .prepare('SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND read_at IS NULL')
    .get(me) as { c: number };
  res.json({ count: c });
});
