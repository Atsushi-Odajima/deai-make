import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import type { ChatMessage, Gender, MeUser, PublicUser } from './types.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  birthdate     TEXT,
  gender        TEXT NOT NULL DEFAULT 'unspecified',
  pronouns      TEXT NOT NULL DEFAULT '',
  headline      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  show_age      INTEGER NOT NULL DEFAULT 1,
  discovery_enabled INTEGER NOT NULL DEFAULT 1,
  verified      INTEGER NOT NULL DEFAULT 0,
  pref_age_min  INTEGER NOT NULL DEFAULT 18,
  pref_age_max  INTEGER NOT NULL DEFAULT 99,
  created_at    TEXT NOT NULL,
  last_active_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS photos (
  id        TEXT PRIMARY KEY,
  user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id, position);

CREATE TABLE IF NOT EXISTS interests (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS swipes (
  id         TEXT PRIMARY KEY,
  swiper_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (swiper_id, target_id)
);
CREATE INDEX IF NOT EXISTS idx_swipes_target ON swipes(target_id, action);

CREATE TABLE IF NOT EXISTS matches (
  id         TEXT PRIMARY KEY,
  user_a     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_super   INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id         TEXT PRIMARY KEY,
  match_id   TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  read_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id, created_at);

CREATE TABLE IF NOT EXISTS blocks (
  blocker_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS reports (
  id          TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  detail      TEXT NOT NULL DEFAULT '',
  created_at  TEXT NOT NULL
);
`);

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  birthdate: string | null;
  gender: string;
  pronouns: string;
  headline: string;
  bio: string;
  location: string;
  show_age: number;
  discovery_enabled: number;
  verified: number;
  pref_age_min: number;
  pref_age_max: number;
  created_at: string;
  last_active_at: string;
}

export function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

export function getPhotos(userId: string): string[] {
  return db
    .prepare('SELECT url FROM photos WHERE user_id = ? ORDER BY position ASC')
    .all(userId)
    .map((r: any) => r.url as string);
}

export function getInterests(userId: string): string[] {
  return db
    .prepare(
      `SELECT i.name FROM interests i
       JOIN user_interests ui ON ui.interest_id = i.id
       WHERE ui.user_id = ? ORDER BY i.name ASC`,
    )
    .all(userId)
    .map((r: any) => r.name as string);
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    displayName: row.display_name,
    age: row.show_age ? ageFromBirthdate(row.birthdate) : null,
    bio: row.bio,
    headline: row.headline,
    location: row.location,
    gender: row.gender as Gender,
    pronouns: row.pronouns,
    photos: getPhotos(row.id),
    interests: getInterests(row.id),
    verified: !!row.verified,
    lastActiveAt: row.last_active_at,
  };
}

export function toMeUser(row: UserRow): MeUser {
  return {
    ...toPublicUser(row),
    age: ageFromBirthdate(row.birthdate),
    email: row.email,
    birthdate: row.birthdate,
    showAge: !!row.show_age,
    discoveryEnabled: !!row.discovery_enabled,
    createdAt: row.created_at,
  };
}

export function getUserRow(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function touchActivity(id: string): void {
  db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

/** Replace a user's interest set, creating interest rows as needed. */
export function setInterests(userId: string, names: string[]): void {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 12);
  const insertInterest = db.prepare('INSERT OR IGNORE INTO interests(name) VALUES (?)');
  const getId = db.prepare('SELECT id FROM interests WHERE name = ?');
  const tx = db.transaction((list: string[]) => {
    db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(userId);
    for (const name of list) {
      insertInterest.run(name);
      const { id } = getId.get(name) as { id: number };
      db.prepare('INSERT OR IGNORE INTO user_interests(user_id, interest_id) VALUES (?, ?)').run(
        userId,
        id,
      );
    }
  });
  tx(clean);
}

/** Replace a user's photo list (array of URLs). */
export function setPhotos(userId: string, urls: string[]): void {
  const clean = urls.filter(Boolean).slice(0, 9);
  const tx = db.transaction((list: string[]) => {
    db.prepare('DELETE FROM photos WHERE user_id = ?').run(userId);
    const stmt = db.prepare('INSERT INTO photos(id, user_id, url, position) VALUES (?, ?, ?, ?)');
    list.forEach((url, i) => stmt.run(crypto.randomUUID(), userId, url, i));
  });
  tx(clean);
}

export function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}
