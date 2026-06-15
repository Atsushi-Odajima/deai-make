import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getUserRow, mapMessage, toPublicUser } from '../db.js';
import type { MatchSummary } from '../types.js';

export const matchesRouter = Router();

interface MatchRow {
  id: string;
  user_a: string;
  user_b: string;
  is_super: number;
  created_at: string;
}

/** Build the chat-list summary for a match from the perspective of `viewerId`. */
export function buildMatchSummary(match: MatchRow, viewerId: string): MatchSummary | null {
  const otherId = match.user_a === viewerId ? match.user_b : match.user_a;
  const other = getUserRow(otherId);
  if (!other) return null;

  const lastRow = db
    .prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(match.id);
  const unread = db
    .prepare(
      'SELECT COUNT(*) AS c FROM messages WHERE match_id = ? AND sender_id != ? AND read_at IS NULL',
    )
    .get(match.id, viewerId) as { c: number };

  return {
    id: match.id,
    user: toPublicUser(other),
    createdAt: match.created_at,
    lastMessage: lastRow ? mapMessage(lastRow) : null,
    unreadCount: unread.c,
    isSuper: !!match.is_super,
  };
}

matchesRouter.use(requireAuth);

matchesRouter.get('/', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare('SELECT * FROM matches WHERE user_a = ? OR user_b = ? ORDER BY created_at DESC')
    .all(me, me) as MatchRow[];

  const summaries = rows
    .map((m) => buildMatchSummary(m, me))
    .filter((s): s is MatchSummary => s !== null)
    // Sort by most recent activity (last message, falling back to match time).
    .sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? a.createdAt;
      const bt = b.lastMessage?.createdAt ?? b.createdAt;
      return bt.localeCompare(at);
    });

  res.json({ matches: summaries });
});

matchesRouter.get('/:id', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as
    | MatchRow
    | undefined;
  if (!match || (match.user_a !== me && match.user_b !== me)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ match: buildMatchSummary(match, me) });
});

// "Who liked you" — incoming likes that aren't matches yet.
matchesRouter.get('/likes/incoming', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare(
      `SELECT s.action, u.* FROM swipes s
       JOIN users u ON u.id = s.swiper_id
       WHERE s.target_id = ?
         AND s.action IN ('like','superlike')
         AND NOT EXISTS (SELECT 1 FROM swipes m WHERE m.swiper_id = ? AND m.target_id = s.swiper_id)
         AND NOT EXISTS (
           SELECT 1 FROM blocks b
           WHERE (b.blocker_id = ? AND b.blocked_id = u.id) OR (b.blocker_id = u.id AND b.blocked_id = ?)
         )
       ORDER BY s.created_at DESC`,
    )
    .all(me, me, me, me) as any[];
  res.json({
    likes: rows.map((r) => ({ ...toPublicUser(r), isSuper: r.action === 'superlike' })),
  });
});

matchesRouter.delete('/:id', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as
    | MatchRow
    | undefined;
  if (!match || (match.user_a !== me && match.user_b !== me)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('DELETE FROM matches WHERE id = ?').run(match.id);
  res.json({ ok: true });
});
