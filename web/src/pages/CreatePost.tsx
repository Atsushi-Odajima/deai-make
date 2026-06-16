import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePost } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { useToast } from '../components/Toast';
import { IconChevronLeft, IconPlus } from '../components/icons';
import { fileToDataUrl } from '../lib/image';
import { useAuth } from '../store/auth';

export function CreatePost() {
  const me = useAuth((s) => s.user);
  const create = useCreatePost();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);
  const inputRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImage(await fileToDataUrl(file));
    if (inputRef.current) inputRef.current.value = '';
  }

  async function submit() {
    if (!image) return;
    try {
      await create.mutateAsync({ imageUrl: image, caption: caption.trim() });
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
          disabled={!image || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '…' : 'シェア'}
        </button>
      </header>

      <div className="screen-scroll subpage-body">
        {image ? (
          <button className="create-image" onClick={() => inputRef.current?.click()}>
            <img src={image} alt="" />
            <span className="create-image-change">写真を変更</span>
          </button>
        ) : (
          <button className="create-image empty" onClick={() => inputRef.current?.click()}>
            <IconPlus width={32} height={32} />
            <span>写真を選択</span>
          </button>
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
          disabled={!image || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '投稿中…' : 'シェアする'}
        </button>
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}
