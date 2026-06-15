// Seeds a lively demo world: a primary "you" account, a cast of people to swipe
// on, some incoming likes, and a couple of ready-made matches with chat history.
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { db, setInterests, setPhotos } from './db.js';

function avatar(id: string, name: string): string {
  return `${config.publicUrl}/api/avatar/${id}.svg?name=${encodeURIComponent(name)}`;
}

interface SeedUser {
  key: string;
  email: string;
  displayName: string;
  birthdate: string;
  gender: 'female' | 'male' | 'nonbinary' | 'other' | 'unspecified';
  pronouns: string;
  headline: string;
  bio: string;
  location: string;
  interests: string[];
  photoCount: number;
}

const PASSWORD = 'password123';

const PEOPLE: SeedUser[] = [
  {
    key: 'you',
    email: 'you@mingle.app',
    displayName: 'あなた',
    birthdate: '1996-04-12',
    gender: 'unspecified',
    pronouns: '',
    headline: 'はじめての街さんぽが好き',
    bio: 'コーヒーと写真と散歩。同じ趣味の友だちを探しています。',
    location: 'Tokyo',
    interests: ['Coffee', 'Photography', 'Hiking', 'Indie Music'],
    photoCount: 2,
  },
  {
    key: 'mio',
    email: 'mio@mingle.app',
    displayName: 'Mio',
    birthdate: '1998-09-03',
    gender: 'female',
    pronouns: 'she/her',
    headline: 'Film photographer & matcha addict',
    bio: 'Weekend hikes, vinyl crates, and finding the best matcha in town.',
    location: 'Tokyo',
    interests: ['Photography', 'Hiking', 'Matcha', 'Vinyl'],
    photoCount: 3,
  },
  {
    key: 'ren',
    email: 'ren@mingle.app',
    displayName: 'Ren',
    birthdate: '1994-01-22',
    gender: 'male',
    pronouns: 'he/him',
    headline: 'Bouldering > everything',
    bio: 'Climb on weekdays, cook ramen on weekends. Looking for climbing buddies.',
    location: 'Yokohama',
    interests: ['Bouldering', 'Ramen', 'Travel', 'Coffee'],
    photoCount: 2,
  },
  {
    key: 'sora',
    email: 'sora@mingle.app',
    displayName: 'Sora',
    birthdate: '1999-11-30',
    gender: 'nonbinary',
    pronouns: 'they/them',
    headline: 'Synth nerd, plant parent',
    bio: 'Making lo-fi beats and over-watering my monstera. Say hi about music gear!',
    location: 'Tokyo',
    interests: ['Indie Music', 'Synths', 'Plants', 'Gaming'],
    photoCount: 2,
  },
  {
    key: 'aoi',
    email: 'aoi@mingle.app',
    displayName: 'Aoi',
    birthdate: '1997-06-18',
    gender: 'female',
    pronouns: 'she/her',
    headline: 'Trail runner & dog person',
    bio: 'Marathon training, third-wave coffee, and my shiba named Mochi.',
    location: 'Chiba',
    interests: ['Running', 'Coffee', 'Dogs', 'Hiking'],
    photoCount: 3,
  },
  {
    key: 'kai',
    email: 'kai@mingle.app',
    displayName: 'Kai',
    birthdate: '1993-03-09',
    gender: 'male',
    pronouns: 'he/him',
    headline: 'Surfer who codes',
    bio: 'Dawn patrol then standups. Always up for a beach trip or a side project.',
    location: 'Kamakura',
    interests: ['Surfing', 'Coding', 'Travel', 'Photography'],
    photoCount: 2,
  },
  {
    key: 'nao',
    email: 'nao@mingle.app',
    displayName: 'Nao',
    birthdate: '2000-02-14',
    gender: 'female',
    pronouns: 'she/her',
    headline: 'Bookworm & board game host',
    bio: 'Hosting board game nights, reading sci-fi, learning to paint.',
    location: 'Tokyo',
    interests: ['Board Games', 'Reading', 'Art', 'Coffee'],
    photoCount: 2,
  },
  {
    key: 'taku',
    email: 'taku@mingle.app',
    displayName: 'Taku',
    birthdate: '1995-08-27',
    gender: 'male',
    pronouns: 'he/him',
    headline: 'Cyclist, jazz, street food',
    bio: 'Long rides on Sundays, jazz bars on Fridays. Tell me your favourite ramen spot.',
    location: 'Saitama',
    interests: ['Cycling', 'Jazz', 'Ramen', 'Travel'],
    photoCount: 2,
  },
  {
    key: 'emi',
    email: 'emi@mingle.app',
    displayName: 'Emi',
    birthdate: '1996-12-05',
    gender: 'female',
    pronouns: 'she/her',
    headline: 'Ceramics & slow living',
    bio: 'Throwing pots, brewing tea, collecting houseplants. Calm energy only.',
    location: 'Tokyo',
    interests: ['Ceramics', 'Tea', 'Plants', 'Art'],
    photoCount: 3,
  },
  {
    key: 'haru',
    email: 'haru@mingle.app',
    displayName: 'Haru',
    birthdate: '1992-07-19',
    gender: 'nonbinary',
    pronouns: 'they/them',
    headline: 'Festival chaser',
    bio: 'Live music every weekend. Indie, techno, anything with a good crowd.',
    location: 'Tokyo',
    interests: ['Indie Music', 'Festivals', 'Travel', 'Photography'],
    photoCount: 2,
  },
  {
    key: 'yui',
    email: 'yui@mingle.app',
    displayName: 'Yui',
    birthdate: '2001-05-08',
    gender: 'female',
    pronouns: 'she/her',
    headline: 'Yoga teacher in training',
    bio: 'Sunrise yoga, smoothie experiments, and a lot of journaling.',
    location: 'Tokyo',
    interests: ['Yoga', 'Cooking', 'Reading', 'Running'],
    photoCount: 2,
  },
  {
    key: 'jun',
    email: 'jun@mingle.app',
    displayName: 'Jun',
    birthdate: '1990-10-11',
    gender: 'male',
    pronouns: 'he/him',
    headline: 'Home chef & whisky curious',
    bio: 'I will cook you the best curry of your life. Also into film and slow travel.',
    location: 'Tokyo',
    interests: ['Cooking', 'Whisky', 'Film', 'Travel'],
    photoCount: 2,
  },
];

function run() {
  console.log('Seeding Mingle demo data…');
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const now = new Date();

  // Wipe existing data for an idempotent seed.
  db.exec(
    'DELETE FROM messages; DELETE FROM matches; DELETE FROM swipes; DELETE FROM blocks; DELETE FROM reports; DELETE FROM user_interests; DELETE FROM photos; DELETE FROM users;',
  );

  const ids: Record<string, string> = {};

  PEOPLE.forEach((p, idx) => {
    const id = crypto.randomUUID();
    ids[p.key] = id;
    // Stagger last-active times so the deck ordering looks natural.
    const lastActive = new Date(now.getTime() - idx * 37 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO users (id, email, password_hash, display_name, birthdate, gender, pronouns,
        headline, bio, location, verified, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id,
      p.email,
      hash,
      p.displayName,
      p.birthdate,
      p.gender,
      p.pronouns,
      p.headline,
      p.bio,
      p.location,
      idx % 4 === 0 ? 1 : 0,
      now.toISOString(),
      lastActive,
    );
    setInterests(id, p.interests);
    setPhotos(
      id,
      Array.from({ length: p.photoCount }, (_, i) => avatar(`${id}-${i}`, p.displayName)),
    );
  });

  const you = ids['you'];

  // Some people already liked "you" → fuels the deck boost and "who liked you".
  const likedYou: [string, string][] = [
    ['mio', 'superlike'],
    ['aoi', 'like'],
    ['nao', 'like'],
    ['haru', 'like'],
  ];
  for (const [key, action] of likedYou) {
    db.prepare(
      'INSERT OR IGNORE INTO swipes (id, swiper_id, target_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(crypto.randomUUID(), ids[key], you, action, now.toISOString());
  }

  // A couple of established matches with chat history.
  function makeMatch(otherKey: string, isSuper: number, messages: [string, string][]) {
    const other = ids[otherKey];
    const [a, b] = [you, other].sort();
    const matchId = crypto.randomUUID();
    const created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO matches (id, user_a, user_b, is_super, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(matchId, a, b, isSuper, created);
    db.prepare(
      'INSERT OR IGNORE INTO swipes (id, swiper_id, target_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(crypto.randomUUID(), you, other, isSuper ? 'superlike' : 'like', created);
    db.prepare(
      'INSERT OR IGNORE INTO swipes (id, swiper_id, target_id, action, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(crypto.randomUUID(), other, you, 'like', created);
    messages.forEach(([senderKey, body], i) => {
      const senderId = senderKey === 'you' ? you : other;
      const ts = new Date(now.getTime() - (messages.length - i) * 11 * 60 * 1000).toISOString();
      const readAt = senderKey === 'you' ? ts : null;
      db.prepare(
        'INSERT INTO messages (id, match_id, sender_id, body, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(crypto.randomUUID(), matchId, senderId, body, ts, readAt);
    });
  }

  makeMatch('ren', 0, [
    ['ren', 'Hey! Saw you climb too — which gym do you go to? 🧗'],
    ['you', 'Mostly B-Pump Akihabara! You?'],
    ['ren', 'Same! We should grab a session this weekend.'],
  ]);
  makeMatch('emi', 1, [
    ['emi', 'Your photography is gorgeous 📷'],
    ['you', 'Thank you! Your ceramics are unreal 😍'],
  ]);

  console.log('Seed complete.');
  console.log('Demo login →  email: you@mingle.app   password: password123');
  console.log(`Created ${PEOPLE.length} users.`);
}

run();
