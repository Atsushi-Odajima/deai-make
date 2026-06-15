import { Router } from 'express';
import { requireAuth, type AuthedRequest } from '../auth.js';
import { ageFromBirthdate, db, toPublicUser, type UserRow } from '../db.js';

export const discoveryRouter = Router();
discoveryRouter.use(requireAuth);

// The swipe deck. Candidates are people the user hasn't acted on yet, ranked by
// shared interests and incoming interest (someone who liked you floats up), so
// the first cards feel relevant rather than random.
discoveryRouter.get('/', (req: AuthedRequest, res) => {
  const me = req.user!;
  const limit = Math.min(Number(req.query.limit ?? 20), 40);

  const rows = db
    .prepare(
      `
    SELECT u.*,
      (SELECT COUNT(*) FROM user_interests a
         JOIN user_interests b ON a.interest_id = b.interest_id
         WHERE a.user_id = @me AND b.user_id = u.id) AS shared,
      (SELECT action FROM swipes WHERE swiper_id = u.id AND target_id = @me) AS incoming
    FROM users u
    WHERE u.id != @me
      AND u.discovery_enabled = 1
      AND NOT EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = @me AND s.target_id = u.id)
      AND NOT EXISTS (
        SELECT 1 FROM blocks bl
        WHERE (bl.blocker_id = @me AND bl.blocked_id = u.id)
           OR (bl.blocker_id = u.id AND bl.blocked_id = @me)
      )
    ORDER BY
      CASE WHEN incoming = 'superlike' THEN 2 WHEN incoming = 'like' THEN 1 ELSE 0 END DESC,
      shared DESC,
      u.last_active_at DESC
    LIMIT @limit
  `,
    )
    .all({ me: me.id, limit }) as (UserRow & { shared: number; incoming: string | null })[];

  // Respect the viewer's age preference (kept in app logic to allow null ages).
  const filtered = rows.filter((r) => {
    const age = ageFromBirthdate(r.birthdate);
    if (age == null) return true;
    return age >= me.pref_age_min && age <= me.pref_age_max;
  });

  res.json({
    candidates: filtered.map((r) => ({
      ...toPublicUser(r),
      sharedInterests: r.shared,
      likedYou: r.incoming === 'like' || r.incoming === 'superlike',
      superLikedYou: r.incoming === 'superlike',
    })),
  });
});
