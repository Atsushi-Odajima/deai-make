import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getUserRow } from '../db.js';
import { emitToUser } from '../realtime.js';
import { buildMatchSummary } from './matches.js';

export const swipesRouter = Router();
swipesRouter.use(requireAuth);

const swipeSchema = z.object({
  targetId: z.string().min(1),
  action: z.enum(['like', 'pass', 'superlike']),
});

swipesRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = swipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const me = req.userId!;
  const { targetId, action } = parsed.data;
  if (targetId === me) {
    res.status(400).json({ error: 'cannot_swipe_self' });
    return;
  }
  const target = getUserRow(targetId);
  if (!target) {
    res.status(404).json({ error: 'not_found' });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    'INSERT OR IGNORE INTO swipes (id, swiper_id, target_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(crypto.randomUUID(), me, targetId, action, now);

  // A match forms only on mutual interest (like/superlike both ways).
  let matched = false;
  let matchSummaryForMe = null;
  if (action === 'like' || action === 'superlike') {
    const reciprocal = db
      .prepare(
        "SELECT action FROM swipes WHERE swiper_id = ? AND target_id = ? AND action IN ('like','superlike')",
      )
      .get(targetId, me) as { action: string } | undefined;

    if (reciprocal) {
      const [a, b] = [me, targetId].sort();
      const isSuper = action === 'superlike' || reciprocal.action === 'superlike' ? 1 : 0;
      const matchId = crypto.randomUUID();
      const result = db
        .prepare(
          'INSERT OR IGNORE INTO matches (id, user_a, user_b, is_super, created_at) VALUES (?, ?, ?, ?, ?)',
        )
        .run(matchId, a, b, isSuper, now);

      const match = db
        .prepare('SELECT * FROM matches WHERE user_a = ? AND user_b = ?')
        .get(a, b) as any;
      matched = true;
      matchSummaryForMe = buildMatchSummary(match, me);

      // Notify both sides in realtime only when the match is freshly created.
      if (result.changes > 0) {
        emitToUser(me, 'match', { match: matchSummaryForMe });
        emitToUser(targetId, 'match', { match: buildMatchSummary(match, targetId) });
      }
    }
  }

  res.json({ matched, match: matchSummaryForMe });
});

// Rewind the most recent swipe (and undo any match it created).
swipesRouter.post('/rewind', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const last = db
    .prepare('SELECT * FROM swipes WHERE swiper_id = ? ORDER BY created_at DESC LIMIT 1')
    .get(me) as { id: string; target_id: string } | undefined;
  if (!last) {
    res.status(404).json({ error: 'nothing_to_rewind' });
    return;
  }
  const [a, b] = [me, last.target_id].sort();
  db.prepare('DELETE FROM matches WHERE user_a = ? AND user_b = ?').run(a, b);
  db.prepare('DELETE FROM swipes WHERE id = ?').run(last.id);
  res.json({ ok: true, targetId: last.target_id });
});
