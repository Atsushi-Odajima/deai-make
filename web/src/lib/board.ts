export interface BoardCategory {
  value: string;
  label: string;
  emoji: string;
}

export const BOARD_CATEGORIES: BoardCategory[] = [
  { value: 'chat', label: '雑談', emoji: '💬' },
  { value: 'recruit', label: '募集', emoji: '🙌' },
  { value: 'question', label: '質問', emoji: '❓' },
  { value: 'event', label: 'イベント', emoji: '📅' },
  { value: 'hobby', label: '趣味', emoji: '🎨' },
  { value: 'market', label: '売買', emoji: '🛍' },
];

export function categoryMeta(value: string): BoardCategory {
  return BOARD_CATEGORIES.find((c) => c.value === value) ?? { value, label: value, emoji: '📌' };
}
