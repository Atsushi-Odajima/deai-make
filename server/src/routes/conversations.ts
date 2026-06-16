import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getAuthor, getUserRow, isBlockedBetween, mapMessage } from '../db.js';
import type { ConversationSummary } from '../types.js';

export const conversationsRouter = Router();

interface ConvRow {
  id: string;
  user_a: string;
  user_b: string;
  created_at: string;
  last_message_at: string;
}

export function getOrCreateConversation(a: string, b: string): ConvRow {
  const [ua, ub] = [a, b].sort();
  let row = db
    .prepare('SELECT * FROM conversations WHERE user_a = ? AND user_b = ?')
    .get(ua, ub) as ConvRow | undefined;
  if (!row) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(
      'INSERT INTO conversations (id, user_a, user_b, created_at, last_message_at) VALUES (?, ?, ?, ?, ?)',
    ).run(id, ua, ub, now, now);
    row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id) as ConvRow;
  }
  return row;
}

export function buildConversationSummary(row: ConvRow, me: string): ConversationSummary | null {
  const otherId = row.user_a === me ? row.user_b : row.user_a;
  if (!getUserRow(otherId)) return null;
  const last = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(row.id);
  const unread = (
    db
      .prepare(
        'SELECT COUNT(*) AS c FROM messages WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
      )
      .get(row.id, me) as { c: number }
  ).c;
  return {
    id: row.id,
    user: getAuthor(otherId),
    lastMessage: last ? mapMessage(last) : null,
    unreadCount: unread,
    updatedAt: row.last_message_at,
  };
}

conversationsRouter.use(requireAuth);

// Open (or fetch) a 1:1 conversation with another user — this is how a DM starts.
const openSchema = z.object({ userId: z.string().min(1) });
conversationsRouter.post('/', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const parsed = openSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const other = parsed.data.userId;
  if (other === me || !getUserRow(other) || isBlockedBetween(me, other)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  const row = getOrCreateConversation(me, other);
  res.json({ conversation: buildConversationSummary(row, me) });
});

conversationsRouter.get('/', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare('SELECT * FROM conversations WHERE user_a = ? OR user_b = ? ORDER BY last_message_at DESC')
    .all(me, me) as ConvRow[];
  const list = rows
    .map((r) => buildConversationSummary(r, me))
    .filter((c): c is ConversationSummary => c !== null)
    // Hide empty conversations from blocked users.
    .filter((c) => !isBlockedBetween(me, c.user.id));
  res.json({ conversations: list });
});

conversationsRouter.get('/:id', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.params.id) as
    | ConvRow
    | undefined;
  if (!row || (row.user_a !== me && row.user_b !== me)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ conversation: buildConversationSummary(row, me) });
});
