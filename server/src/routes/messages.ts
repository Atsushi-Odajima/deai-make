import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, isBlockedBetween, mapMessage } from '../db.js';
import { emitToUser } from '../realtime.js';
import { buildConversationSummary } from './conversations.js';

export const messagesRouter = Router();
messagesRouter.use(requireAuth);

interface ConvRow {
  id: string;
  user_a: string;
  user_b: string;
}

function loadConv(convId: string, me: string): ConvRow | null {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(convId) as
    | ConvRow
    | undefined;
  if (!row || (row.user_a !== me && row.user_b !== me)) return null;
  return row;
}

messagesRouter.get('/:conversationId', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const conv = loadConv(req.params.conversationId, me);
  if (!conv) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC')
    .all(conv.id);

  const now = new Date().toISOString();
  db.prepare(
    'UPDATE messages SET read_at = ? WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL',
  ).run(now, conv.id, me);

  const other = conv.user_a === me ? conv.user_b : conv.user_a;
  emitToUser(other, 'read', { conversationId: conv.id, readerId: me, readAt: now });

  res.json({ messages: rows.map(mapMessage) });
});

const sendSchema = z.object({ body: z.string().min(1).max(2000) });

messagesRouter.post('/:conversationId', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const conv = loadConv(req.params.conversationId, me);
  if (!conv) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const other = conv.user_a === me ? conv.user_b : conv.user_a;
  if (isBlockedBetween(me, other)) {
    res.status(403).json({ error: 'blocked' });
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
    'INSERT INTO messages (id, conversation_id, sender_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, conv.id, me, parsed.data.body.trim(), now);
  db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(now, conv.id);

  const message = mapMessage(db.prepare('SELECT * FROM messages WHERE id = ?').get(id));
  const fullConv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id) as any;
  emitToUser(other, 'message', {
    message,
    conversation: buildConversationSummary(fullConv, other),
  });

  res.status(201).json({ message });
});
