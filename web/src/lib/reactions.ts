// The four fixed story reactions. Both label text and emoji are always shown.
export interface ReactionDef {
  code: string;
  label: string;
  emoji: string;
}

export const STORY_REACTIONS: ReactionDef[] = [
  { code: 'like', label: 'いいね！', emoji: '👍' },
  { code: 'akan', label: 'アカン！', emoji: '😫' },
  { code: 'bad', label: '良くない', emoji: '🙅‍♂️' },
  { code: 'helpful', label: '参考になる', emoji: '😳' },
];

export function reactionOf(code: string | null | undefined): ReactionDef | undefined {
  return code ? STORY_REACTIONS.find((r) => r.code === code) : undefined;
}
