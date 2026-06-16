import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBoardPost } from '../api/hooks';
import { useToast } from '../components/Toast';
import { IconChevronLeft } from '../components/icons';
import { BOARD_CATEGORIES } from '../lib/board';

export function CreateBoardPost() {
  const create = useCreateBoardPost();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  const [category, setCategory] = useState('chat');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  async function submit() {
    if (!title.trim()) return;
    try {
      const { post } = await create.mutateAsync({ category, title: title.trim(), body: body.trim() });
      show('スレッドを作成しました');
      navigate(`/app/board/${post.id}`, { replace: true });
    } catch {
      show('作成に失敗しました');
    }
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">スレッドを作成</span>
        <button
          className="btn btn-ghost"
          style={{ height: 40, padding: '0 8px' }}
          disabled={!title.trim() || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '…' : '投稿'}
        </button>
      </header>

      <div className="screen-scroll subpage-body">
        <div className="field">
          <label>カテゴリ</label>
          <div className="chip-row">
            {BOARD_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip${category === c.value ? ' selected' : ''}`}
                onClick={() => setCategory(c.value)}
              >
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>タイトル</label>
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例: 週末に一緒に走れる人募集"
            maxLength={80}
          />
        </div>
        <div className="field">
          <label>本文</label>
          <textarea
            className="textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="詳細を書きましょう（任意）"
            style={{ minHeight: 160 }}
            maxLength={2000}
          />
        </div>
        <button
          className="btn btn-primary btn-block"
          disabled={!title.trim() || create.isPending}
          onClick={submit}
        >
          {create.isPending ? '投稿中…' : 'スレッドを投稿'}
        </button>
      </div>
    </div>
  );
}
