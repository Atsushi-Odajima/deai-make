import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config.js';
import { requireAuth, signToken, type AuthedRequest } from '../auth.js';
import { db, getUserRow, setInterests, setPhotos, toMeUser } from '../db.js';
import type { AuthResponse } from '../types.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(40),
  birthdate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['female', 'male', 'nonbinary', 'other', 'unspecified']).default('unspecified'),
});

function mustBe18(birthdate: string): boolean {
  const dob = new Date(birthdate);
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 18);
  return dob.getTime() <= cutoff.getTime();
}

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() });
    return;
  }
  const { email, password, displayName, birthdate, gender } = parsed.data;
  if (!mustBe18(birthdate)) {
    res.status(400).json({ error: 'must_be_18' });
    return;
  }
  const normalizedEmail = email.toLowerCase();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (exists) {
    res.status(409).json({ error: 'email_taken' });
    return;
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(
    `INSERT INTO users (id, email, password_hash, display_name, birthdate, gender, created_at, last_active_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, normalizedEmail, hash, displayName, birthdate, gender, now, now);

  // Give every new account a generated avatar so the deck never shows blanks.
  setPhotos(id, [`${config.publicUrl}/api/avatar/${id}.svg?name=${encodeURIComponent(displayName)}`]);
  setInterests(id, []);

  const token = signToken(id);
  const body: AuthResponse = { token, user: toMeUser(getUserRow(id)!) };
  res.status(201).json(body);
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

authRouter.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input' });
    return;
  }
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(parsed.data.email.toLowerCase()) as any;
  if (!row || !bcrypt.compareSync(parsed.data.password, row.password_hash)) {
    res.status(401).json({ error: 'invalid_credentials' });
    return;
  }
  const token = signToken(row.id);
  const body: AuthResponse = { token, user: toMeUser(row) };
  res.json(body);
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: toMeUser(req.user!) });
});
