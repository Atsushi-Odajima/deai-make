import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, mapMessage } from '../db.js';
import { emitToUser } from '../realtime.js';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

interface MatchRow {
  id: string;
  user_a: string;
  user_b: string;
}

function loadMatchForUser(matchId: string, userId: string): MatchRow | null {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId) as
    | MatchRow
    | undefined;
  if (!match || (match.user_a !== userId && match.user_b !== userId)) return null;
  return match;
}

// List messages for a match (oldest first) and mark incoming ones as read.
messagesRouter.get('/:matchId', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const match = loadMatchForUser(req.params.matchId, me);
  if (!match) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM messages WHERE match_id = ? ORDER BY created_at ASC')
    .all(match.id);

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE messages SET read_at = ? WHERE match_id = ? AND sender_id != ? AND read_at IS NULL',
  ).run(now, match.id, me);

  const other = match.user_a === me ? match.user_b : match.user_a;
  emitToUser(other, 'read', { matchId: match.id, readerId: me, readAt: now });

  res.json({ messages: rows.map(mapMessage) });
});

const sendSchema = z.object({ body: z.string().min(1).max(2000) });

messagesRouter.post('/:matchId', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const match = loadMatchForUser(req.params.matchId, me);
  if (!match) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO messages (id, match_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, match.id, me, parsed.data.body.trim(), now);

  const message = mapMessage(
    db.prepare('SELECT * FROM messages WHERE id = ?').get(id),
  );
  const other = match.user_a === me ? match.user_b : match.user_a;
  emitToUser(other, 'message', { message });

  res.status(201).json({ message });
});
