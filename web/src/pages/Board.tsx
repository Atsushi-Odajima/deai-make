import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoard } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconComment, IconPlus } from '../components/icons';
import { BOARD_CATEGORIES, categoryMeta } from '../lib/board';
import { relativeTime } from '../lib/time';

export function Board() {
  const [category, setCategory] = useState('');
  const { data, isLoading } = useBoard(category);
  const navigate = useNavigate();
  const posts = data?.posts ?? [];

  return (
    <div className="screen-inner flush">
      <header className="topbar">
        <span className="page-title">掲示板</span>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => navigate('/app/board/new')} aria-label="スレッドを作成">
            <IconPlus width={22} height={22} />
          </button>
        </div>
      </header>

      <div className="board-cats">
        <button className={`board-cat${category === '' ? ' active' : ''}`} onClick={() => setCategory('')}>
          すべて
        </button>
        {BOARD_CATEGORIES.map((c) => (
          <button
            key={c.value}
            className={`board-cat${category === c.value ? ' active' : ''}`}
            onClick={() => setCategory(c.value)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="center-col">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="center-col">
          <div className="deck-empty-emoji">📝</div>
          <h3>まだ投稿がありません</h3>
          <p className="muted">最初のスレッドを立ててみましょう。</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/board/new')}>
            スレッドを作成
          </button>
        </div>
      ) : (
        <ul className="board-list">
          {posts.map((p) => {
            const meta = categoryMeta(p.category);
            return (
              <li key={p.id}>
                <button className="board-item" onClick={() => navigate(`/app/board/${p.id}`)}>
                  <div className="board-item-top">
                    <span className="board-tag">
                      {meta.emoji} {meta.label}
                    </span>
                    <span className="board-time">{relativeTime(p.createdAt)}</span>
                  </div>
                  <h3 className="board-title">{p.title}</h3>
                  {p.body && <p className="board-snippet">{p.body}</p>}
                  <div className="board-item-foot">
                    <span className="board-author">
                      <Avatar src={p.author.avatar} name={p.author.displayName} size={22} />
                      {p.author.displayName}
                    </span>
                    <span className="board-comment-count">
                      <IconComment width={15} height={15} /> {p.commentCount}
                    </span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button className="fab" onClick={() => navigate('/app/board/new')} aria-label="スレッドを作成">
        <IconPlus width={26} height={26} />
      </button>
    </div>
  );
}
