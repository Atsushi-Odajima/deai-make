import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthedRequest } from '../auth.js';
import {
  db,
  getUserRow,
  setInterests,
  setPhotos,
  toMeUser,
  toPublicUser,
  type UserRow,
} from '../db.js';

export const usersRouter = Router();
usersRouter.use(requireAuth);

const updateSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  headline: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(80).optional(),
  pronouns: z.string().max(40).optional(),
  gender: z.enum(['female', 'male', 'nonbinary', 'other', 'unspecified']).optional(),
  showAge: z.boolean().optional(),
  discoveryEnabled: z.boolean().optional(),
  prefAgeMin: z.number().int().min(18).max(99).optional(),
  prefAgeMax: z.number().int().min(18).max(99).optional(),
  photos: z.array(z.string().url().or(z.string().startsWith('data:image/'))).max(9).optional(),
  interests: z.array(z.string().min(1).max(30)).max(12).optional(),
});

const FIELD_MAP: Record<string, string> = {
  displayName: 'display_name',
  headline: 'headline',
  bio: 'bio',
  location: 'location',
  pronouns: 'pronouns',
  gender: 'gender',
  showAge: 'show_age',
  discoveryEnabled: 'discovery_enabled',
  prefAgeMin: 'pref_age_min',
  prefAgeMax: 'pref_age_max',
};

usersRouter.patch('/me', (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    return;
  }
  const data = parsed.data;
  const userId = req.userId!;

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

// Public profile of another user (respects blocks).
usersRouter.get('/:id', (req: AuthedRequest, res) => {
  const target = getUserRow(req.params.id) as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  const blocked = db
    .prepare('SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)')
    .get(req.userId, target.id, target.id, req.userId);
  if (blocked) {
    res.status(404).json({ error: 'not_found' });
    return;
  }
  res.json({ user: toPublicUser(target) });
});

// Trending / suggested interest tags to help onboarding.
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
