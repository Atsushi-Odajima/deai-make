import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateStory } from '../api/hooks';
import { useToast } from '../components/Toast';
import { IconChevronLeft, IconPlus } from '../components/icons';
import { fileToDataUrl } from '../lib/image';

const QUICK_EMOJI = ['😊', '😍', '😂', '👍', '🔥', '🎉', '✨', '🙏', '💙', '☀️', '🍵', '📸', '🎶', '🥳', '😎', '😢'];

export function CreateStory() {
  const create = useCreateStory();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState('');

  // Prompt for an image immediately.
  useEffect(() => {
    fileRef.current?.click();
  }, []);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImage(await fileToDataUrl(file));
    else if (!image) navigate(-1);
    if (fileRef.current) fileRef.current.value = '';
  }

  function addEmoji(emoji: string) {
    setText((t) => (t + emoji).slice(0, 200));
    taRef.current?.focus();
  }

  async function share() {
    if (!image) return;
    try {
      await create.mutateAsync({ imageUrl: image, caption: text.trim() });
      show('ストーリーズに追加しました');
      navigate('/app/home');
    } catch {
      show('投稿に失敗しました');
    }
  }

  return (
    <div className="story-editor">
      {image && <img className="story-editor-media" src={image} alt="" />}

      <div className="story-editor-top">
        <button className="icon-btn ghost light" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
      </div>

      {image && (
        <textarea
          ref={taRef}
          className="story-editor-text"
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 200))}
          placeholder="テキストを入力…"
          rows={2}
        />
      )}

      {image && (
        <div className="story-editor-bottom">
          <div className="emoji-bar">
            {QUICK_EMOJI.map((em) => (
              <button key={em} className="emoji-btn" onClick={() => addEmoji(em)}>
                {em}
              </button>
            ))}
          </div>
          <button className="btn btn-primary story-share" onClick={share} disabled={create.isPending}>
            {create.isPending ? '投稿中…' : 'シェア'}
          </button>
        </div>
      )}

      {!image && (
        <button className="story-editor-pick" onClick={() => fileRef.current?.click()}>
          <IconPlus width={32} height={32} />
          <span>写真を選択</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}
