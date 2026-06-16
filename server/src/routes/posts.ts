import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { db, getAuthor, isBlockedBetween } from '../db.js';
import { emitToUser } from '../realtime.js';
import type { Comment, Post } from '../types.js';

export const postsRouter = Router();
postsRouter.use(requireAuth);

interface PostRow {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  created_at: string;
}

function mapPost(row: PostRow, me: string): Post {
  const likeCount = (
    db.prepare('SELECT COUNT(*) AS c FROM post_likes WHERE post_id = ?').get(row.id) as { c: number }
  ).c;
  const commentCount = (
    db.prepare('SELECT COUNT(*) AS c FROM post_comments WHERE post_id = ?').get(row.id) as {
      c: number;
    }
  ).c;
  const likedByMe = !!db
    .prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?')
    .get(row.id, me);
  return {
    id: row.id,
    author: getAuthor(row.user_id),
    imageUrl: row.image_url,
    caption: row.caption,
    createdAt: row.created_at,
    likeCount,
    commentCount,
    likedByMe,
  };
}

const createSchema = z.object({
  imageUrl: z.string().url().or(z.string().startsWith('data:image/')),
  caption: z.string().max(2200).optional(),
});

postsRouter.post('/', (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const id = crypto.randomUUID();
  db.prepare(
    'INSERT INTO posts (id, user_id, image_url, caption, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, req.userId!, parsed.data.imageUrl, parsed.data.caption ?? '', new Date().toISOString());
  res.status(201).json({ post: mapPost(db.prepare('SELECT * FROM posts WHERE id = ?').get(id) as PostRow, req.userId!) });
});

// Home feed: posts from people you follow + your own. Falls back to recent
// global posts when you don't follow anyone yet, so home is never empty.
postsRouter.get('/feed', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const followed = db
    .prepare(
      `SELECT p.* FROM posts p
       WHERE (p.user_id = @me OR p.user_id IN (SELECT following_id FROM follows WHERE follower_id = @me))
         AND NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=@me AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=@me))
       ORDER BY p.created_at DESC LIMIT 60`,
    )
    .all({ me }) as PostRow[];

  let rows = followed;
  if (rows.length < 5) {
    rows = db
      .prepare(
        `SELECT p.* FROM posts p
         WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=@me AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=@me))
         ORDER BY p.created_at DESC LIMIT 60`,
      )
      .all({ me }) as PostRow[];
  }
  res.json({ posts: rows.map((r) => mapPost(r, me)) });
});

// Explore grid: recent posts from everyone.
postsRouter.get('/explore', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare(
      `SELECT p.* FROM posts p
       WHERE NOT EXISTS (SELECT 1 FROM blocks b WHERE (b.blocker_id=@me AND b.blocked_id=p.user_id) OR (b.blocker_id=p.user_id AND b.blocked_id=@me))
       ORDER BY p.created_at DESC LIMIT 60`,
    )
    .all({ me }) as PostRow[];
  res.json({ posts: rows.map((r) => mapPost(r, me)) });
});

postsRouter.get('/user/:userId', (req: AuthedRequest, res) => {
  const me = req.userId!;
  if (isBlockedBetween(me, req.params.userId)) {
    res.json({ posts: [] });
    return;
  }
  const rows = db
    .prepare('SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.params.userId) as PostRow[];
  res.json({ posts: rows.map((r) => mapPost(r, me)) });
});

postsRouter.get('/:id', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as PostRow | undefined;
  if (!row || isBlockedBetween(req.userId!, row.user_id)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ post: mapPost(row, req.userId!) });
});

postsRouter.delete('/:id', (req: AuthedRequest, res) => {
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as PostRow | undefined;
  if (!row || row.user_id !== req.userId) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

postsRouter.post('/:id/like', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as PostRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)').run(
    req.params.id,
    me,
    new Date().toISOString(),
  );
  if (row.user_id !== me) emitToUser(row.user_id, 'post_like', { postId: row.id, from: me });
  res.json({ post: mapPost(row, me) });
});

postsRouter.delete('/:id/like', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const row = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as PostRow | undefined;
  if (!row) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, me);
  res.json({ post: mapPost(row, me) });
});

postsRouter.get('/:id/comments', (req: AuthedRequest, res) => {
  const rows = db
    .prepare('SELECT * FROM post_comments WHERE post_id = ? ORDER BY created_at ASC')
    .all(req.params.id) as any[];
  const comments: Comment[] = rows.map((r) => ({
    id: r.id,
    author: getAuthor(r.user_id),
    body: r.body,
    createdAt: r.created_at,
  }));
  res.json({ comments });
});

const commentSchema = z.object({ body: z.string().min(1).max(1000) });

postsRouter.post('/:id/comments', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id) as PostRow | undefined;
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
    'INSERT INTO post_comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, req.params.id, me, parsed.data.body.trim(), now);
  if (post.user_id !== me) emitToUser(post.user_id, 'post_comment', { postId: post.id, from: me });
  res.status(201).json({
    comment: { id, author: getAuthor(me), body: parsed.data.body.trim(), createdAt: now } as Comment,
  });
});
