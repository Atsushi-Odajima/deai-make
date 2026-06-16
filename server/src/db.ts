import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import type { ChatMessage, Gender, MeUser, PostAuthor, PublicUser } from './types.js';

fs.mkdirSync(path.dirname(config.dbPath), { recursive: true });

export const db = new Database(config.dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT NOT NULL,
  birthdate     TEXT,
  gender        TEXT NOT NULL DEFAULT 'unspecified',
  pronouns      TEXT NOT NULL DEFAULT '',
  headline      TEXT NOT NULL DEFAULT '',
  bio           TEXT NOT NULL DEFAULT '',
  location      TEXT NOT NULL DEFAULT '',
  link          TEXT NOT NULL DEFAULT '',
  show_age      INTEGER NOT NULL DEFAULT 1,
  discovery_enabled INTEGER NOT NULL DEFAULT 1,
  verified      INTEGER NOT NULL DEFAULT 0,
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

CREATE TABLE IF NOT EXISTS follows (
  follower_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TEXT NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);

CREATE TABLE IF NOT EXISTS posts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL DEFAULT '',
  caption    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id, created_at);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id         TEXT PRIMARY KEY,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_post_comments ON post_comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS conversations (
  id              TEXT PRIMARY KEY,
  user_a          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TEXT NOT NULL,
  last_message_at TEXT NOT NULL,
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id              TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  read_at         TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS board_posts (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category   TEXT NOT NULL DEFAULT 'chat',
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  image_url  TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_board_cat ON board_posts(category, created_at);

CREATE TABLE IF NOT EXISTS board_comments (
  id            TEXT PRIMARY KEY,
  board_post_id TEXT NOT NULL REFERENCES board_posts(id) ON DELETE CASCADE,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body          TEXT NOT NULL,
  created_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_board_comments ON board_comments(board_post_id, created_at);

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

CREATE TABLE IF NOT EXISTS post_images (
  id        TEXT PRIMARY KEY,
  post_id   TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url       TEXT NOT NULL,
  position  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_post_images ON post_images(post_id, position);

CREATE TABLE IF NOT EXISTS stories (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url  TEXT NOT NULL,
  caption    TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stories_user ON stories(user_id, created_at);

CREATE TABLE IF NOT EXISTS story_views (
  story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id  TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  entity_id  TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  read_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at);

CREATE TABLE IF NOT EXISTS story_reactions (
  story_id   TEXT NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction   TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id    TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id, created_at);
`);

export interface UserRow {
  id: string;
  email: string;
  username: string | null;
  password_hash: string;
  display_name: string;
  birthdate: string | null;
  gender: string;
  pronouns: string;
  headline: string;
  bio: string;
  location: string;
  link: string;
  show_age: number;
  discovery_enabled: number;
  verified: number;
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

function countScalar(sql: string, ...params: unknown[]): number {
  return (db.prepare(sql).get(...params) as { c: number }).c;
}

export function toPublicUser(row: UserRow, viewerId?: string): PublicUser {
  const followers = countScalar('SELECT COUNT(*) AS c FROM follows WHERE following_id = ?', row.id);
  const following = countScalar('SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?', row.id);
  const postsCount = countScalar('SELECT COUNT(*) AS c FROM posts WHERE user_id = ?', row.id);
  const isFollowing = viewerId
    ? !!db
        .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
        .get(viewerId, row.id)
    : false;
  const followsYou = viewerId
    ? !!db
        .prepare('SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?')
        .get(row.id, viewerId)
    : false;
  return {
    id: row.id,
    username: row.username ?? row.id.slice(0, 8),
    displayName: row.display_name,
    age: row.show_age ? ageFromBirthdate(row.birthdate) : null,
    bio: row.bio,
    headline: row.headline,
    location: row.location,
    link: row.link,
    gender: row.gender as Gender,
    pronouns: row.pronouns,
    photos: getPhotos(row.id),
    interests: getInterests(row.id),
    verified: !!row.verified,
    lastActiveAt: row.last_active_at,
    followersCount: followers,
    followingCount: following,
    postsCount,
    isFollowing,
    followsYou,
  };
}

export function toMeUser(row: UserRow): MeUser {
  return {
    ...toPublicUser(row, row.id),
    age: ageFromBirthdate(row.birthdate),
    email: row.email,
    birthdate: row.birthdate,
    showAge: !!row.show_age,
    discoveryEnabled: !!row.discovery_enabled,
    createdAt: row.created_at,
  };
}

/** Compact author block embedded in posts, comments, messages, board items. */
export function getAuthor(userId: string): PostAuthor {
  const row = getUserRow(userId);
  if (!row) {
    return { id: userId, username: 'unknown', displayName: '退会したユーザー', avatar: '', verified: false };
  }
  const photos = getPhotos(userId);
  return {
    id: row.id,
    username: row.username ?? row.id.slice(0, 8),
    displayName: row.display_name,
    avatar: photos[0] ?? '',
    verified: !!row.verified,
  };
}

export function getUserRow(id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function touchActivity(id: string): void {
  db.prepare('UPDATE users SET last_active_at = ? WHERE id = ?').run(new Date().toISOString(), id);
}

export function isBlockedBetween(a: string, b: string): boolean {
  return !!db
    .prepare(
      'SELECT 1 FROM blocks WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?)',
    )
    .get(a, b, b, a);
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

export function getPostImages(postId: string): string[] {
  return db
    .prepare('SELECT url FROM post_images WHERE post_id = ? ORDER BY position ASC')
    .all(postId)
    .map((r: any) => r.url as string);
}

export function setPostImages(postId: string, urls: string[]): void {
  const clean = urls.filter(Boolean).slice(0, 10);
  const stmt = db.prepare('INSERT INTO post_images(id, post_id, url, position) VALUES (?, ?, ?, ?)');
  clean.forEach((url, i) => stmt.run(crypto.randomUUID(), postId, url, i));
}

/** Record a notification for `userId` triggered by `actorId`. No self-notifs. */
export function createNotification(
  userId: string,
  actorId: string,
  type: 'follow' | 'like' | 'comment' | 'board_comment' | 'story_reaction',
  entityId = '',
): void {
  if (userId === actorId || isBlockedBetween(userId, actorId)) return;
  db.prepare(
    'INSERT INTO notifications (id, user_id, actor_id, type, entity_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(crypto.randomUUID(), userId, actorId, type, entityId, new Date().toISOString());
}

export function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}
