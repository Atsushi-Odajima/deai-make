import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExplore, useSearchPosts, useSearchUsers } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconComment, IconHeartFilled, IconSearch } from '../components/icons';

export function Search() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'users' | 'posts'>('users');
  const navigate = useNavigate();
  const explore = useExplore();
  const search = useSearchUsers(q.trim());
  const postSearch = useSearchPosts(q.trim());

  const searching = q.trim().length > 0;
  const users = search.data?.users ?? [];
  const foundPosts = postSearch.data?.posts ?? [];
  const posts = explore.data?.posts ?? [];

  return (
    <div className="screen-inner flush">
      <header className="topbar search-bar-wrap">
        <div className="search-field">
          <IconSearch width={18} height={18} />
          <input
            className="search-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="名前・@ユーザー名・趣味で検索"
            autoCapitalize="off"
          />
          {q && (
            <button className="search-clear" onClick={() => setQ('')} aria-label="クリア">
              ✕
            </button>
          )}
        </div>
      </header>

      {searching ? (
        <>
          <div className="board-cats search-tabs">
            <button
              className={`board-cat${tab === 'users' ? ' active' : ''}`}
              onClick={() => setTab('users')}
            >
              アカウント
            </button>
            <button
              className={`board-cat${tab === 'posts' ? ' active' : ''}`}
              onClick={() => setTab('posts')}
            >
              投稿
            </button>
          </div>
          {tab === 'users' ? (
            <div className="user-results">
              {users.length === 0 ? (
                <p className="empty-line muted">該当するユーザーが見つかりませんでした。</p>
              ) : (
                users.map((u) => (
                  <button key={u.id} className="user-row" onClick={() => navigate(`/app/u/${u.username}`)}>
                    <Avatar src={u.photos[0]} name={u.displayName} size={48} />
                    <div className="user-row-text">
                      <span className="user-row-username">
                        {u.username}
                        {u.verified && <span className="mini-verified">✓</span>}
                      </span>
                      <span className="user-row-name">
                        {u.displayName}
                        {u.headline ? ` · ${u.headline}` : ''}
                      </span>
                    </div>
                    {u.followsYou && <span className="follows-you-tag">フォローされています</span>}
                  </button>
                ))
              )}
            </div>
          ) : foundPosts.length === 0 ? (
            <p className="empty-line muted">該当する投稿が見つかりませんでした。</p>
          ) : (
            <div className="explore-grid">
              {foundPosts.map((p) => (
                <button key={p.id} className="explore-cell" onClick={() => navigate(`/app/post/${p.id}`)}>
                  <img src={p.imageUrl} alt={p.caption} />
                  <span className="explore-stats">
                    <span>
                      <IconHeartFilled width={15} height={15} /> {p.likeCount}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="explore-grid">
          {posts.map((p) => (
            <button key={p.id} className="explore-cell" onClick={() => navigate(`/app/post/${p.id}`)}>
              <img src={p.imageUrl} alt={p.caption} />
              <span className="explore-stats">
                <span>
                  <IconHeartFilled width={15} height={15} /> {p.likeCount}
                </span>
                <span>
                  <IconComment width={15} height={15} /> {p.commentCount}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
