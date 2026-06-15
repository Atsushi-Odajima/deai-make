import { KeyboardEvent, useState } from 'react';
import { useSuggestedInterests } from '../api/hooks';
import { IconPlus, IconX } from './icons';

const DEFAULTS = [
  'Coffee', 'Photography', 'Hiking', 'Travel', 'Gaming', 'Cooking', 'Running', 'Music',
  'Art', 'Reading', 'Cycling', 'Yoga', 'Movies', 'Coding', 'Plants', 'Board Games',
];

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

export function InterestPicker({ value, onChange, max = 12 }: Props) {
  const { data } = useSuggestedInterests();
  const [draft, setDraft] = useState('');

  const suggestions = [...new Set([...(data?.interests ?? []), ...DEFAULTS])]
    .filter((s) => !value.includes(s))
    .slice(0, 18);

  function toggle(name: string) {
    if (value.includes(name)) {
      onChange(value.filter((v) => v !== name));
    } else if (value.length < max) {
      onChange([...value, name]);
    }
  }

  function addDraft() {
    const name = draft.trim();
    if (name && !value.includes(name) && value.length < max) {
      onChange([...value, name]);
    }
    setDraft('');
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDraft();
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="chip-row" style={{ marginBottom: 12 }}>
          {value.map((name) => (
            <button key={name} type="button" className="chip selected" onClick={() => toggle(name)}>
              {name}
              <IconX width={14} height={14} />
            </button>
          ))}
        </div>
      )}

      <div className="interest-add">
        <input
          className="input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          placeholder="自分の趣味を追加"
          maxLength={30}
        />
        <button type="button" className="icon-btn" onClick={addDraft} aria-label="追加">
          <IconPlus />
        </button>
      </div>

      {suggestions.length > 0 && (
        <>
          <p className="field-hint" style={{ margin: '14px 0 8px' }}>
            おすすめ（最大{max}個）
          </p>
          <div className="chip-row">
            {suggestions.map((name) => (
              <button key={name} type="button" className="chip" onClick={() => toggle(name)}>
                {name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
