// Option sets for the richer (matchmaking-style) profile fields.

export const OCCUPATIONS = [
  'IT',
  '金融',
  'サービス業',
  '公務員',
  '外資系',
  '営業職',
  '医療・福祉',
  '教育',
  'クリエイティブ',
  '製造',
  '経営・自営',
  '学生',
  'その他',
];

// Ordered slim → heavy, exactly as requested.
export const BODY_TYPES = [
  'ガリガリ',
  '細い',
  '普通',
  'お腹だけ酒ぽちゃ',
  'ぽちゃ',
  '太ってる',
  'デブ',
];

// Height dropdown 140–210cm.
export const HEIGHTS = Array.from({ length: 71 }, (_, i) => 140 + i);

// Suggested hobbies surfaced in the interest picker (Japanese-first).
export const HOBBY_SUGGESTIONS = [
  'サッカー',
  'キャンプ',
  'ゴルフ',
  'お酒',
  '家呑み',
  '映画',
  '音楽',
  '旅行',
  'カフェ',
  '写真',
  '読書',
  'ゲーム',
  '料理',
  '筋トレ',
  'ランニング',
  'ドライブ',
  'アニメ',
  '釣り',
  'ヨガ',
  'ボードゲーム',
];
