import { ChangeEvent, useRef } from 'react';
import { IconPlus, IconStar, IconX } from './icons';

interface Props {
  photos: string[];
  onChange: (next: string[]) => void;
  max?: number;
}

// Reads a file into a compressed data URL so it can be sent inline to the API
// (no separate upload endpoint needed for the MVP / demo).
function fileToDataUrl(file: File, maxDim = 1080): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(reader.result as string);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function PhotoEditor({ photos, onChange, max = 9 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const room = max - photos.length;
    const picked = await Promise.all(files.slice(0, room).map((f) => fileToDataUrl(f)));
    onChange([...photos, ...picked]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(i: number) {
    onChange(photos.filter((_, idx) => idx !== i));
  }
  function makeFirst(i: number) {
    if (i === 0) return;
    const next = [...photos];
    const [p] = next.splice(i, 1);
    onChange([p, ...next]);
  }

  return (
    <div className="photo-grid">
      {photos.map((url, i) => (
        <div key={i} className="photo-slot filled">
          <img src={url} alt="" />
          {i === 0 ? (
            <span className="photo-main-tag">メイン</span>
          ) : (
            <button
              type="button"
              className="photo-action photo-star"
              onClick={() => makeFirst(i)}
              aria-label="メインにする"
            >
              <IconStar width={15} height={15} />
            </button>
          )}
          <button
            type="button"
            className="photo-action photo-remove"
            onClick={() => remove(i)}
            aria-label="削除"
          >
            <IconX width={15} height={15} />
          </button>
        </div>
      ))}
      {photos.length < max && (
        <button type="button" className="photo-slot add" onClick={() => inputRef.current?.click()}>
          <IconPlus />
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
    </div>
  );
}
