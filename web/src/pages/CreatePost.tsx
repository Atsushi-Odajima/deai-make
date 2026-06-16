import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePost } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { IconChevronLeft, IconPlus, IconX } from '../components/icons';
import { fileToDataUrl } from '../lib/image';
import { useAuth } from '../store/auth';

export function CreatePost() {
  const me = useAuth((s) => s.user);
  const create = useCreatePost();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);
  const inputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const room = 10 - images.length;
    const added = await Promise.all(files.slice(0, room).map((f) => fileToDataUrl(f)));
    setImages((prev) => [...prev, ...added]);
    if (inputRef.current) inputRef.current.value = '';
  }

  function removeImage(i: number) {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    if (images.length === 0) return;
    try {
      await create.mutateAsync({ imageUrls: images, caption: caption.trim() });
      show('投稿しました');
      navigate('/app/home');
    } catch {
      show('投稿に失敗しました');
    }
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">新規投稿</span>
        <button
          className="btn btn-ghost"
          style={{ height: 40, padding: '0 8px' }}
          disabled={images.length === 0 || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '…' : 'シェア'}
        </button>
      </header>

      <div className="screen-scroll subpage-body">
        {images.length === 0 ? (
          <button className="create-image empty" onClick={() => inputRef.current?.click()}>
            <IconPlus width={32} height={32} />
            <span>写真を選択（最大10枚）</span>
          </button>
        ) : (
          <div className="create-thumbs">
            {images.map((src, i) => (
              <div key={i} className="create-thumb">
                <img src={src} alt="" />
                {i === 0 && <span className="create-thumb-cover">表紙</span>}
                <button className="create-thumb-x" onClick={() => removeImage(i)} aria-label="削除">
                  <IconX width={14} height={14} />
                </button>
              </div>
            ))}
            {images.length < 10 && (
              <button className="create-thumb add" onClick={() => inputRef.current?.click()}>
                <IconPlus width={26} height={26} />
              </button>
            )}
          </div>
        )}

        <div className="create-caption">
          <Avatar src={me?.photos[0]} name={me?.displayName ?? ''} size={40} />
          <textarea
            className="create-caption-input"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="キャプションを書く…"
            maxLength={2200}
          />
        </div>

        <button
          className="btn btn-primary btn-block"
          style={{ marginTop: 20 }}
          disabled={images.length === 0 || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '投稿中…' : 'シェアする'}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={pick} />
    </div>
  );
}
