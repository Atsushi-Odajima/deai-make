import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getAuthor, isBlockedBetween } from '../db.js';
import type { StoryGroup, StoryItem } from '../types.js';

export const storiesRouter = Router();
storiesRouter.use(requireAuth);

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

interface StoryRow {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
  expires_at: string;
}

function activeStoriesFor(userId: string): StoryRow[] {
  return db
    .prepare('SELECT * FROM stories WHERE user_id = ? AND expires_at > ? ORDER BY created_at ASC')
    .all(userId, new Date().toISOString()) as StoryRow[];
}

function toItem(row: StoryRow, viewerId: string): StoryItem {
  const viewed = !!db
    .prepare('SELECT 1 FROM story_views WHERE story_id = ? AND viewer_id = ?')
    .get(row.id, viewerId);
  return { id: row.id, imageUrl: row.image_url, caption: row.caption, createdAt: row.created_at, viewed };
}

const createSchema = z.object({
  imageUrl: z.string().url().or(z.string().startsWith('data:image/')),
  caption: z.string().max(200).optional(),
});

storiesRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const now = Date.now();
  db.prepare(
    'INSERT INTO stories (id, user_id, image_url, caption, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(
    id,
    req.userId!,
    parsed.data.imageUrl,
    parsed.data.caption ?? '',
    new Date(now).toISOString(),
    new Date(now + STORY_TTL_MS).toISOString(),
  );
  res.status(201).json({ ok: true, id });
});

// Story tray: self first, then followed users with active stories
// (unseen rings first).
storiesRouter.get('/feed', (req: AuthedRequest, res) => {
  const me = req.userId!;

  const candidateIds = [
    me,
    ...(db
      .prepare('SELECT following_id FROM follows WHERE follower_id = ?')
      .all(me) as { following_id: string }[]).map((r) => r.following_id),
  ];

  const groups: StoryGroup[] = [];
  for (const uid of candidateIds) {
    if (uid !== me && isBlockedBetween(me, uid)) continue;
    const rows = activeStoriesFor(uid);
    if (rows.length === 0) continue;
    const items = rows.map((r) => toItem(r, me));
    groups.push({
      user: getAuthor(uid),
      items,
      hasUnseen: items.some((i) => !i.viewed),
      isSelf: uid === me,
    });
  }

  groups.sort((a, b) => {
    if (a.isSelf !== b.isSelf) return a.isSelf ? -1 : 1;
    if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
    return (b.items.at(-1)?.createdAt ?? '').localeCompare(a.items.at(-1)?.createdAt ?? '');
  });

  res.json({ groups });
});

storiesRouter.post('/:id/view', (req: AuthedRequest, res) => {
  db.prepare('INSERT OR IGNORE INTO story_views (story_id, viewer_id, created_at) VALUES (?, ?, ?)').run(
    req.params.id,
    req.userId!,
    new Date().toISOString(),
  );
  res.json({ ok: true });
});

storiesRouter.delete('/:id', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id) as
    | StoryRow
    | undefined;
  if (!row || row.user_id !== req.userId) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('DELETE FROM stories WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});
