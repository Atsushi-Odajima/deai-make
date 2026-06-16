import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getAuthor, isBlockedBetween } from '../db.js';
import { emitToUser } from '../realtime.js';
import type { BoardComment, BoardPost } from '../types.js';

export const boardRouter = Router();
boardRouter.use(requireAuth);

export const BOARD_CATEGORIES = ['chat', 'recruit', 'question', 'event', 'hobby', 'market'] as const;
type Category = (typeof BOARD_CATEGORIES)[number];

interface BoardRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  image_url: string;
  created_at: string;
}

function mapBoardPost(row: BoardRow): BoardPost {
  const commentCount = (
    db.prepare('SELECT COUNT(*) AS c FROM board_comments WHERE board_post_id = ?').get(row.id) as {
      c: number;
    }
  ).c;
  return {
    id: row.id,
    author: getAuthor(row.user_id),
    category: row.category,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    commentCount,
  };
}

boardRouter.get('/', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const category = String(req.query.category ?? '');
  const valid = (BOARD_CATEGORIES as readonly string[]).includes(category);
  const rows = (
    valid
      ? db.prepare('SELECT * FROM board_posts WHERE category = ? ORDER BY created_at DESC LIMIT 80').all(category)
      : db.prepare('SELECT * FROM board_posts ORDER BY created_at DESC LIMIT 80').all()
  ) as BoardRow[];
  res.json({ posts: rows.filter((r) => !isBlockedBetween(me, r.user_id)).map(mapBoardPost) });
});

const createSchema = z.object({
  category: z.enum(BOARD_CATEGORIES),
  title: z.string().min(1).max(80),
  body: z.string().max(2000).optional(),
  imageUrl: z.string().url().or(z.string().startsWith('data:image/')).optional(),
});

boardRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const { category, title, body, imageUrl } = parsed.data;
  db.prepare(
    'INSERT INTO board_posts (id, user_id, category, title, body, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, req.userId!, category as Category, title, body ?? '', imageUrl ?? '', new Date().toISOString());
  res.status(201).json({ post: mapBoardPost(db.prepare('SELECT * FROM board_posts WHERE id = ?').get(id) as BoardRow) });
});

boardRouter.get('/:id', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM board_posts WHERE id = ?').get(req.params.id) as
    | BoardRow
    | undefined;
  if (!row || isBlockedBetween(req.userId!, row.user_id)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ post: mapBoardPost(row) });
});

boardRouter.delete('/:id', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM board_posts WHERE id = ?').get(req.params.id) as
    | BoardRow
    | undefined;
  if (!row || row.user_id !== req.userId) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('DELETE FROM board_posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

boardRouter.get('/:id/comments', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM board_comments WHERE board_post_id = ? ORDER BY created_at ASC')
    .all(req.params.id) as any[];
  const comments: BoardComment[] = rows.map((r) => ({
    id: r.id,
    author: getAuthor(r.user_id),
    body: r.body,
    createdAt: r.created_at,
  }));
  res.json({ comments });
});

const commentSchema = z.object({ body: z.string().min(1).max(1000) });

boardRouter.post('/:id/comments', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const post = db.prepare('SELECT * FROM board_posts WHERE id = ?').get(req.params.id) as
    | BoardRow
    | undefined;
  if (!post) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    'INSERT INTO board_comments (id, board_post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, req.params.id, me, parsed.data.body.trim(), now);
  if (post.user_id !== me) emitToUser(post.user_id, 'board_comment', { boardId: post.id, from: me });
  res.status(201).json({
    comment: { id, author: getAuthor(me), body: parsed.data.body.trim(), createdAt: now } as BoardComment,
  });
});
