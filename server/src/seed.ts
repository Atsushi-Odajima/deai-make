// Seeds a lively Instagram-style demo world: profiles with posts, a follow
// graph, likes & comments, a few DM threads, and a populated board (掲示板).
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { createNotification, db, setInterests, setPhotos, setPostImages } from './db.js';

const PASSWORD = 'password123';

function avatar(id: string, name: string): string {
  return `${config.publicUrl}/api/avatar/${id}.svg?name=${encodeURIComponent(name)}`;
}
function image(seed: string): string {
  // No name → abstract gradient that reads as a photo.
  return `${config.publicUrl}/api/avatar/${seed}.svg`;
}

interface SeedUser {
  key: string;
  username: string;
  email: string;
  displayName: string;
  birthdate: string;
  gender: 'female' | 'male' | 'nonbinary' | 'other' | 'unspecified';
  pronouns: string;
  headline: string;
  bio: string;
  location: string;
  link: string;
  interests: string[];
  posts: string[]; // captions
}

const PEOPLE: SeedUser[] = [
  {
    key: 'you', username: 'you', email: 'you@mingle.app', displayName: 'あなた',
    birthdate: '1996-04-12', gender: 'unspecified', pronouns: '',
    headline: '街さんぽと喫茶店めぐり', bio: 'コーヒーと写真と散歩。気の合う人とゆるくつながりたい。',
    location: 'Tokyo', link: '', interests: ['Coffee', 'Photography', 'Hiking', 'Indie Music'],
    posts: ['今日の一杯 ☕️', '路地裏さんぽ', '朝の光が好き'],
  },
  {
    key: 'mio', username: 'mio.films', email: 'mio@mingle.app', displayName: 'Mio',
    birthdate: '1998-09-03', gender: 'female', pronouns: 'she/her',
    headline: 'フィルムカメラと抹茶', bio: '週末はハイキング、平日はレコード堀り。抹茶スイーツに目がない。',
    location: 'Tokyo', link: 'mio.photo', interests: ['Photography', 'Hiking', 'Matcha', 'Vinyl'],
    posts: ['フィルムの粒状感たまらない', '高尾山からの景色', '今週のレコード'],
  },
  {
    key: 'ren', username: 'ren_climbs', email: 'ren@mingle.app', displayName: 'Ren',
    birthdate: '1994-01-22', gender: 'male', pronouns: 'he/him',
    headline: 'ボルダリングと自炊', bio: '平日クライム、週末ラーメン。一緒に登る仲間募集中。',
    location: 'Yokohama', link: '', interests: ['Bouldering', 'Ramen', 'Travel', 'Coffee'],
    posts: ['新しい課題、完登！', '自家製チャーシュー'],
  },
  {
    key: 'sora', username: 'sora.synth', email: 'sora@mingle.app', displayName: 'Sora',
    birthdate: '1999-11-30', gender: 'nonbinary', pronouns: 'they/them',
    headline: 'シンセと観葉植物', bio: 'lo-fi作ってます。モンステラ育ててます。機材トーク歓迎。',
    location: 'Tokyo', link: 'soundcloud.com/sora', interests: ['Indie Music', 'Synths', 'Plants', 'Gaming'],
    posts: ['新しいパッチ組んだ', 'うちのモンステラ', 'ジャム配信中'],
  },
  {
    key: 'aoi', username: 'aoi.runs', email: 'aoi@mingle.app', displayName: 'Aoi',
    birthdate: '1997-06-18', gender: 'female', pronouns: 'she/her',
    headline: 'トレランと柴犬', bio: 'マラソン練習中。サードウェーブコーヒーと、柴犬のもち。',
    location: 'Chiba', link: '', interests: ['Running', 'Coffee', 'Dogs', 'Hiking'],
    posts: ['今朝の20km', 'もち、お散歩日和', 'ご褒美ラテ'],
  },
  {
    key: 'kai', username: 'kai.surf', email: 'kai@mingle.app', displayName: 'Kai',
    birthdate: '1993-03-09', gender: 'male', pronouns: 'he/him',
    headline: '波とコード', bio: '朝サーフしてから出社。ビーチもサイドプロジェクトも歓迎。',
    location: 'Kamakura', link: '', interests: ['Surfing', 'Coding', 'Travel', 'Photography'],
    posts: ['ドーンパトロール', '今日のセット'],
  },
  {
    key: 'nao', username: 'nao.reads', email: 'nao@mingle.app', displayName: 'Nao',
    birthdate: '2000-02-14', gender: 'female', pronouns: 'she/her',
    headline: '読書とボドゲ', bio: 'ボードゲーム会主催。SF読書と水彩はじめました。',
    location: 'Tokyo', link: '', interests: ['Board Games', 'Reading', 'Art', 'Coffee'],
    posts: ['今月の積読', 'ボドゲ会やります', '水彩練習'],
  },
  {
    key: 'emi', username: 'emi.ceramics', email: 'emi@mingle.app', displayName: 'Emi',
    birthdate: '1996-12-05', gender: 'female', pronouns: 'she/her',
    headline: '陶芸とスローライフ', bio: '器をつくり、お茶を淹れ、植物を育てる。穏やかに。',
    location: 'Tokyo', link: '', interests: ['Ceramics', 'Tea', 'Plants', 'Art'],
    posts: ['焼き上がりました', '新作のマグ', '今日の一服'],
  },
  {
    key: 'haru', username: 'haru.live', email: 'haru@mingle.app', displayName: 'Haru',
    birthdate: '1992-07-19', gender: 'nonbinary', pronouns: 'they/them',
    headline: 'フェス遠征勢', bio: '毎週どこかでライブ。インディーもテクノも、いい現場なら何でも。',
    location: 'Tokyo', link: '', interests: ['Indie Music', 'Festivals', 'Travel', 'Photography'],
    posts: ['昨夜の現場最高だった', '次の遠征先'],
  },
  {
    key: 'yui', username: 'yui.yoga', email: 'yui@mingle.app', displayName: 'Yui',
    birthdate: '2001-05-08', gender: 'female', pronouns: 'she/her',
    headline: 'ヨガと朝活', bio: '朝ヨガ、スムージー研究、たくさんのジャーナリング。',
    location: 'Tokyo', link: '', interests: ['Yoga', 'Cooking', 'Reading', 'Running'],
    posts: ['サンライズヨガ', '今朝のスムージー'],
  },
  {
    key: 'jun', username: 'jun.kitchen', email: 'jun@mingle.app', displayName: 'Jun',
    birthdate: '1990-10-11', gender: 'male', pronouns: 'he/him',
    headline: '家ごはんとウイスキー', bio: '人生最高のカレーを作ります。映画とスロートラベルも。',
    location: 'Tokyo', link: '', interests: ['Cooking', 'Whisky', 'Film', 'Travel'],
    posts: ['スパイスから作るカレー', '週末の一杯'],
  },
];

interface BoardSeed {
  authorKey: string;
  category: string;
  title: string;
  body: string;
  comments: [string, string][]; // [authorKey, body]
}

const BOARD: BoardSeed[] = [
  {
    authorKey: 'ren', category: 'recruit', title: '週末ボルダリング一緒に行きませんか？',
    body: '土曜の午前、B-Pump秋葉原で登ります。初心者の方も大歓迎です！',
    comments: [['aoi', '行きたいです！初心者でも大丈夫ですか？'], ['ren', 'もちろんです、ゆるくやりましょう〜']],
  },
  {
    authorKey: 'nao', category: 'event', title: '【今週末】ボードゲーム会@渋谷',
    body: '7〜8人でわいわいやります。手ぶらでOK、軽食持ち寄り歓迎。',
    comments: [['jun', 'カタンあります？'], ['nao', 'ありますよ〜！']],
  },
  {
    authorKey: 'mio', category: 'hobby', title: 'フィルムカメラ好き集まれ',
    body: 'おすすめの現像所や作例を共有しましょう。最近はポートラ400にハマってます。',
    comments: [['kai', 'ポートラいいですよね、自分はトライX派です']],
  },
  {
    authorKey: 'jun', category: 'question', title: '都内でスパイスが安く買えるお店',
    body: 'カレー作り用にホールスパイスをまとめ買いしたいです。おすすめありますか？',
    comments: [['emi', '新大久保のお店が安かったですよ']],
  },
  {
    authorKey: 'haru', category: 'chat', title: '最近行ってよかったライブ・フェス',
    body: 'ジャンル問わず、今年行ってよかった現場を教えてください！',
    comments: [],
  },
];

function run() {
  console.log('Seeding Mingle (Instagram-style) demo data…');
  const hash = bcrypt.hashSync(PASSWORD, 10);
  const now = new Date();

  db.exec(
    `DELETE FROM board_comments; DELETE FROM board_posts; DELETE FROM messages; DELETE FROM conversations;
     DELETE FROM post_comments; DELETE FROM post_likes; DELETE FROM posts; DELETE FROM follows;
     DELETE FROM blocks; DELETE FROM reports; DELETE FROM user_interests; DELETE FROM photos; DELETE FROM users;`,
  );

  const ids: Record<string, string> = {};
  const postIds: Record<string, string[]> = {};

  PEOPLE.forEach((p, idx) => {
    const id = crypto.randomUUID();
    ids[p.key] = id;
    const lastActive = new Date(now.getTime() - idx * 31 * 60 * 1000).toISOString();
    db.prepare(
      `INSERT INTO users (id, email, username, password_hash, display_name, birthdate, gender, pronouns,
        headline, bio, location, link, verified, created_at, last_active_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      id, p.email, p.username, hash, p.displayName, p.birthdate, p.gender, p.pronouns,
      p.headline, p.bio, p.location, p.link, idx % 4 === 0 ? 1 : 0, now.toISOString(), lastActive,
    );
    setInterests(id, p.interests);
    setPhotos(id, [avatar(`${id}-a`, p.displayName)]);

    postIds[p.key] = [];
    p.posts.forEach((caption, pi) => {
      const pid = crypto.randomUUID();
      postIds[p.key].push(pid);
      const created = new Date(now.getTime() - (idx * 3 + pi) * 5 * 60 * 60 * 1000).toISOString();
      // Every 3rd post is a multi-image carousel.
      const count = pi % 3 === 0 ? 3 : 1;
      const images = Array.from({ length: count }, (_, k) => image(`${pid}-${k}`));
      db.prepare(
        'INSERT INTO posts (id, user_id, image_url, caption, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(pid, id, images[0], caption, created);
      setPostImages(pid, images);
    });
  });

  const keys = PEOPLE.map((p) => p.key);

  // Follow graph: everyone follows a few others; "you" follows several.
  function follow(a: string, b: string) {
    db.prepare('INSERT OR IGNORE INTO follows (follower_id, following_id, created_at) VALUES (?, ?, ?)').run(
      ids[a], ids[b], now.toISOString(),
    );
  }
  ['mio', 'ren', 'aoi', 'sora', 'emi', 'nao'].forEach((k) => follow('you', k));
  ['mio', 'aoi', 'nao', 'haru', 'kai'].forEach((k) => follow(k, 'you'));
  keys.forEach((a) => {
    keys.filter((b) => b !== a).slice(0, 3).forEach((b) => follow(a, b));
  });

  // Likes & comments spread across posts.
  const allPosts: { pid: string; ownerKey: string }[] = [];
  for (const k of keys) for (const pid of postIds[k]) allPosts.push({ pid, ownerKey: k });
  allPosts.forEach(({ pid }, i) => {
    keys.slice(0, 4 + (i % 5)).forEach((k) => {
      db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id, created_at) VALUES (?, ?, ?)').run(
        pid, ids[k], now.toISOString(),
      );
    });
  });
  const sampleComments = ['素敵です！', 'いいですね〜', 'どこで撮ったんですか？', '行ってみたい', 'センスある✨'];
  allPosts.slice(0, 12).forEach(({ pid }, i) => {
    const commenter = keys[(i + 2) % keys.length];
    db.prepare(
      'INSERT INTO post_comments (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
    ).run(crypto.randomUUID(), pid, ids[commenter], sampleComments[i % sampleComments.length], now.toISOString());
  });

  // A couple of DM threads for "you".
  function dm(otherKey: string, msgs: [string, string][]) {
    const [a, b] = [ids['you'], ids[otherKey]].sort();
    const cid = crypto.randomUUID();
    const created = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    let lastTs = created;
    db.prepare(
      'INSERT INTO conversations (id, user_a, user_b, created_at, last_message_at) VALUES (?, ?, ?, ?, ?)',
    ).run(cid, a, b, created, created);
    msgs.forEach(([sender, body], i) => {
      const ts = new Date(now.getTime() - (msgs.length - i) * 13 * 60 * 1000).toISOString();
      lastTs = ts;
      const readAt = sender === 'you' ? ts : null;
      db.prepare(
        'INSERT INTO messages (id, conversation_id, sender_id, body, created_at, read_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(crypto.randomUUID(), cid, sender === 'you' ? ids['you'] : ids[otherKey], body, ts, readAt);
    });
    db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(lastTs, cid);
  }
  dm('mio', [
    ['mio', 'はじめまして！フィルムの作例めっちゃ好みでした📷'],
    ['you', 'ありがとうございます！Mioさんの抹茶の投稿も最高です🍵'],
    ['mio', '今度おすすめの喫茶店ご一緒しません？'],
  ]);
  dm('ren', [
    ['ren', 'プロフィール見ました！ハイキング好きなんですね'],
    ['you', 'はい！今度どこか登りましょう⛰'],
  ]);

  // Board threads + comments.
  for (const t of BOARD) {
    const bid = crypto.randomUUID();
    const created = new Date(now.getTime() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare(
      'INSERT INTO board_posts (id, user_id, category, title, body, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ).run(bid, ids[t.authorKey], t.category, t.title, t.body, '', created);
    t.comments.forEach(([k, body], i) => {
      const ts = new Date(new Date(created).getTime() + (i + 1) * 40 * 60 * 1000).toISOString();
      db.prepare(
        'INSERT INTO board_comments (id, board_post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)',
      ).run(crypto.randomUUID(), bid, ids[k], body, ts);
    });
  }

  // Active stories for several people you follow (+ a couple for yourself).
  const storyTellers: [string, number][] = [
    ['mio', 2], ['aoi', 1], ['sora', 3], ['emi', 1], ['ren', 1], ['you', 1],
  ];
  const youStoryIds: string[] = [];
  for (const [key, n] of storyTellers) {
    for (let i = 0; i < n; i++) {
      const sid = crypto.randomUUID();
      if (key === 'you') youStoryIds.push(sid);
      const created = new Date(now.getTime() - (i + 1) * 90 * 60 * 1000);
      db.prepare(
        'INSERT INTO stories (id, user_id, image_url, caption, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(
        sid, ids[key], image(`story-${sid}`), '',
        created.toISOString(), new Date(created.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      );
    }
  }

  // Viewers + reactions on your story, so the viewer list is populated.
  if (youStoryIds[0]) {
    const reactors: [string, string | null][] = [
      ['mio', 'like'], ['aoi', 'helpful'], ['ren', 'akan'], ['sora', null], ['nao', 'bad'],
    ];
    reactors.forEach(([k, r], i) => {
      const ts = new Date(now.getTime() - i * 12 * 60 * 1000).toISOString();
      db.prepare('INSERT OR IGNORE INTO story_views (story_id, viewer_id, created_at) VALUES (?, ?, ?)').run(
        youStoryIds[0], ids[k], ts,
      );
      if (r) {
        db.prepare(
          'INSERT OR IGNORE INTO story_reactions (story_id, user_id, reaction, created_at) VALUES (?, ?, ?, ?)',
        ).run(youStoryIds[0], ids[k], r, ts);
        createNotification(ids['you'], ids[k], 'story_reaction', youStoryIds[0]);
      }
    });
  }

  // Give your first story a text/emoji caption.
  if (youStoryIds[0]) {
    db.prepare('UPDATE stories SET caption = ? WHERE id = ?').run(
      'はじめてのストーリーズ ✨😊', youStoryIds[0],
    );
  }

  // A few bookmarks for you.
  for (const k of ['mio', 'emi', 'kai']) {
    if (postIds[k]?.[0]) {
      db.prepare('INSERT OR IGNORE INTO bookmarks (user_id, post_id, created_at) VALUES (?, ?, ?)').run(
        ids['you'], postIds[k][0], now.toISOString(),
      );
    }
  }

  // Footprints on your profile (recent visitors for the あしあと screen).
  ['mio', 'ren', 'aoi', 'sora', 'kai', 'nao', 'haru', 'emi'].forEach((k, i) => {
    db.prepare(
      'INSERT OR IGNORE INTO footprints (target_id, visitor_id, created_at) VALUES (?, ?, ?)',
    ).run(ids['you'], ids[k], new Date(now.getTime() - i * 17 * 60 * 1000).toISOString());
  });

  // Notifications addressed to "you".
  createNotification(ids['you'], ids['mio'], 'follow', ids['mio']);
  createNotification(ids['you'], ids['aoi'], 'follow', ids['aoi']);
  if (postIds['you'][0]) {
    createNotification(ids['you'], ids['ren'], 'like', postIds['you'][0]);
    createNotification(ids['you'], ids['sora'], 'like', postIds['you'][0]);
    createNotification(ids['you'], ids['emi'], 'comment', postIds['you'][0]);
  }

  console.log('Seed complete.');
  console.log('Demo login →  email: you@mingle.app   password: password123');
  console.log(`Created ${PEOPLE.length} users, ${allPosts.length} posts, ${BOARD.length} board threads.`);
}

run();
