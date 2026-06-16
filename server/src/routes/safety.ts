import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getUserRow } from '../db.js';

export const safetyRouter = Router();
safetyRouter.use(requireAuth);

// Blocking is mutual-invisibility: removes any match and hides both from each other.
safetyRouter.post('/block/:id', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const targetId = req.params.id;
  if (targetId === me || !getUserRow(targetId)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  const now = new Date().toISOString();
  db.prepare('INSERT OR IGNORE INTO blocks (blocker_id, blocked_id, created_at) VALUES (?, ?, ?)').run(
    me,
    targetId,
    now,
  );
  // Blocking severs the social graph in both directions.
  db.prepare(
    'DELETE FROM follows WHERE (follower_id = ? AND following_id = ?) OR (follower_id = ? AND following_id = ?)',
  ).run(me, targetId, targetId, me);
  res.json({ ok: true });
});

safetyRouter.delete('/block/:id', (req: AuthedRequest, res) => {
  db.prepare('DELETE FROM blocks WHERE blocker_id = ? AND blocked_id = ?').run(
    req.userId,
    req.params.id,
  );
  res.json({ ok: true });
});

const reportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'fake', 'underage', 'other']),
  detail: z.string().max(1000).optional(),
});

safetyRouter.post('/report/:id', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const targetId = req.params.id;
  if (targetId === me || !getUserRow(targetId)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  db.prepare(
    'INSERT INTO reports (id, reporter_id, reported_id, reason, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    crypto.randomUUID(),
    me,
    targetId,
    parsed.data.reason,
    parsed.data.detail ?? '',
    new Date().toISOString(),
  );
  res.json({ ok: true });
});
