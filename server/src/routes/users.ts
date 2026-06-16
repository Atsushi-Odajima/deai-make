import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import {
  createNotification,
  db,
  getUserRow,
  isBlockedBetween,
  setInterests,
  setPhotos,
  toMeUser,
  toPublicUser,
  type UserRow,
} from '../db.js';
import { emitToUser } from '../realtime.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

const updateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  username: z
    .string()
    .min(2)
    .max(20)
    .regex(/^[a-z0-9_]+$/, 'lowercase_alnum_only')
    .optional(),
  headline: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(80).optional(),
  link: z.string().max(120).optional(),
  pronouns: z.string().max(40).optional(),
  gender: z.enum(['female', 'male', 'nonbinary', 'other', 'unspecified']).optional(),
  showAge: z.boolean().optional(),
  discoveryEnabled: z.boolean().optional(),
  photos: z.array(z.string().url().or(z.string().startsWith('data:image/'))).max(9).optional(),
  interests: z.array(z.string().min(1).max(30)).max(12).optional(),
});

const FIELD_MAP: Record<string, string> = {
  displayName: 'display_name',
  username: 'username',
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  link: 'link',
  pronouns: 'pronouns',
  gender: 'gender',
  showAge: 'show_age',
  discoveryEnabled: 'discovery_enabled',
};

usersRouter.patch('/me', (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const userId = req.userId!;

  if (data.username) {
    const taken = db
      .prepare('SELECT 1 FROM users WHERE username = ? AND id != ?')
      .get(data.username, userId);
    if (taken) {
      res.status(409).json({ error: 'username_taken' });
      return;
    }
  }

  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [key, col] of Object.entries(FIELD_MAP)) {
    if (key in data && data[key as keyof typeof data] !== undefined) {
      let value: unknown = data[key as keyof typeof data];
      if (typeof value === 'boolean') value = value ? 1 : 0;
      sets.push(`${col} = ?`);
      values.push(value);
    }
  }
  if (sets.length) {
    values.push(userId);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...(values as any[]));
  }
  if (data.photos) setPhotos(userId, data.photos);
  if (data.interests) setInterests(userId, data.interests);

  res.json({ user: toMeUser(getUserRow(userId)!) });
});

// Search members by name, @username, or interest.
usersRouter.get('/search', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const q = String(req.query.q ?? '').trim();
  const like = `%${q}%`;
  const rows = (
    q
      ? db
          .prepare(
            `SELECT DISTINCT u.* FROM users u
             LEFT JOIN user_interests ui ON ui.user_id = u.id
             LEFT JOIN interests i ON i.id = ui.interest_id
             WHERE u.id != @me AND u.discovery_enabled = 1
               AND (u.display_name LIKE @like OR u.username LIKE @like OR u.headline LIKE @like OR i.name LIKE @like)
             ORDER BY u.last_active_at DESC LIMIT 40`,
          )
          .all({ me, like })
      : db
          .prepare(
            `SELECT * FROM users WHERE id != ? AND discovery_enabled = 1
             ORDER BY last_active_at DESC LIMIT 30`,
          )
          .all(me)
  ) as UserRow[];

  const filtered = rows.filter((r) => !isBlockedBetween(me, r.id));
  res.json({ users: filtered.map((r) => toPublicUser(r, me)) });
});

// Suggested people to follow (most followed, excluding self + already followed).
usersRouter.get('/suggested', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare(
      `SELECT u.*, (SELECT COUNT(*) FROM follows f WHERE f.following_id = u.id) AS followers
       FROM users u
       WHERE u.id != @me AND u.discovery_enabled = 1
         AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = @me AND f.following_id = u.id)
       ORDER BY followers DESC, u.last_active_at DESC LIMIT 12`,
    )
    .all({ me }) as UserRow[];
  res.json({ users: rows.filter((r) => !isBlockedBetween(me, r.id)).map((r) => toPublicUser(r, me)) });
});

usersRouter.get('/meta/interests', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT i.name, COUNT(ui.user_id) AS uses
       FROM interests i LEFT JOIN user_interests ui ON ui.interest_id = i.id
       GROUP BY i.id ORDER BY uses DESC, i.name ASC LIMIT 40`,
    )
    .all() as { name: string; uses: number }[];
  res.json({ interests: rows.map((r) => r.name) });
});

// Resolve a profile by id OR @username.
usersRouter.get('/:idOrUsername', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const key = req.params.idOrUsername;
  const target =
    (getUserRow(key) as UserRow | undefined) ??
    (db.prepare('SELECT * FROM users WHERE username = ?').get(key) as UserRow | undefined);
  if (!target || isBlockedBetween(me, target.id)) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ user: toPublicUser(target, me) });
});

// Follow / unfollow.
usersRouter.post('/:id/follow', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const target = req.params.id;
  if (target === me || !getUserRow(target) || isBlockedBetween(me, target)) {
    res.status(400).json({ error: 'invalid_target' });
    return;
  }
  const result = db
    .prepare('INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)')
    .run(me, target, new Date().toISOString());
  if (result.changes > 0) {
    createNotification(target, me, 'follow', me);
    emitToUser(target, 'notification', {});
  }
  emitToUser(target, 'follow', { from: me });
  res.json({ user: toPublicUser(getUserRow(target)!, me) });
});

usersRouter.delete('/:id/follow', (req: AuthedRequest, res) => {
  const me = req.userId!;
  db.prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?').run(me, req.params.id);
  const target = getUserRow(req.params.id);
  res.json({ user: target ? toPublicUser(target, me) : null });
});

// Followers / following lists.
usersRouter.get('/:id/followers', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare(
      `SELECT u.* FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE f.following_id = ? ORDER BY f.created_at DESC`,
    )
    .all(req.params.id) as UserRow[];
  res.json({ users: rows.filter((r) => !isBlockedBetween(me, r.id)).map((r) => toPublicUser(r, me)) });
});

usersRouter.get('/:id/following', (req: AuthedRequest, res) => {
  const me = req.userId!;
  const rows = db
    .prepare(
      `SELECT u.* FROM follows f JOIN users u ON u.id = f.following_id
       WHERE f.follower_id = ? ORDER BY f.created_at DESC`,
    )
    .all(req.params.id) as UserRow[];
  res.json({ users: rows.filter((r) => !isBlockedBetween(me, r.id)).map((r) => toPublicUser(r, me)) });
});
