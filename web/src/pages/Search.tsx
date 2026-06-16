import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useExplore, useSearchPosts, useSearchUsers, type UserSearchFilters } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { Sheet } from '../components/Sheet';
import { IconComment, IconFilter, IconHeartFilled, IconSearch } from '../components/icons';
import { BODY_TYPES, HEIGHTS, OCCUPATIONS } from '../lib/profileOptions';

const EMPTY: UserSearchFilters = {};

export function Search() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'users' | 'posts'>('users');
  const [filters, setFilters] = useState<UserSearchFilters>(EMPTY);
  const [draft, setDraft] = useState<UserSearchFilters>(EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const navigate = useNavigate();

  const explore = useExplore();
  const search = useSearchUsers(q.trim(), filters);
  const postSearch = useSearchPosts(q.trim());

  const filterCount =
    (filters.occupation ? 1 : 0) +
    (filters.bodyType ? 1 : 0) +
    (filters.heightMin || filters.heightMax ? 1 : 0);
  const searching = q.trim().length > 0 || filterCount > 0;

  const users = search.data?.users ?? [];
  const foundPosts = postSearch.data?.posts ?? [];
  const posts = explore.data?.posts ?? [];

  function openFilter() {
    setDraft(filters);
    setFilterOpen(true);
  }
  function applyFilter() {
    setFilters(draft);
    setTab('users');
    setFilterOpen(false);
  }
  function clearFilter() {
    setDraft(EMPTY);
    setFilters(EMPTY);
    setFilterOpen(false);
  }

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
        <button className={`icon-btn filter-btn${filterCount ? ' on' : ''}`} onClick={openFilter} aria-label="絞り込み">
          <IconFilter width={20} height={20} />
          {filterCount > 0 && <span className="filter-count">{filterCount}</span>}
        </button>
      </header>

      {searching ? (
        <>
          <div className="board-cats search-tabs">
            <button className={`board-cat${tab === 'users' ? ' active' : ''}`} onClick={() => setTab('users')}>
              アカウント
            </button>
            <button className={`board-cat${tab === 'posts' ? ' active' : ''}`} onClick={() => setTab('posts')}>
              投稿
            </button>
          </div>

          {filterCount > 0 && tab === 'users' && (
            <div className="active-filters">
              {filters.occupation && <span className="filter-chip">仕事: {filters.occupation}</span>}
              {filters.bodyType && <span className="filter-chip">体型: {filters.bodyType}</span>}
              {(filters.heightMin || filters.heightMax) && (
                <span className="filter-chip">
                  身長: {filters.heightMin || '〜'}〜{filters.heightMax || '〜'}cm
                </span>
              )}
              <button className="filter-chip clear" onClick={clearFilter}>
                クリア ✕
              </button>
            </div>
          )}

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
                        {[u.occupation, u.height > 0 ? `${u.height}cm` : '', u.bodyType]
                          .filter(Boolean)
                          .join(' · ') || u.displayName}
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

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="絞り込み">
        <div className="field">
          <label>仕事</label>
          <select
            className="select"
            value={draft.occupation ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, occupation: e.target.value || undefined }))}
          >
            <option value="">指定なし</option>
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>体型</label>
          <select
            className="select"
            value={draft.bodyType ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, bodyType: e.target.value || undefined }))}
          >
            <option value="">指定なし</option>
            {BODY_TYPES.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>身長</label>
          <div className="age-range">
            <select
              className="select age-select"
              value={draft.heightMin ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, heightMin: Number(e.target.value) || undefined }))}
            >
              <option value={0}>下限</option>
              {HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>〜</span>
            <select
              className="select age-select"
              value={draft.heightMax ?? 0}
              onChange={(e) => setDraft((d) => ({ ...d, heightMax: Number(e.target.value) || undefined }))}
            >
              <option value={0}>上限</option>
              {HEIGHTS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>cm</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button className="btn btn-subtle" onClick={clearFilter}>
            クリア
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={applyFilter}>
            この条件で検索
          </button>
        </div>
      </Sheet>
    </div>
  );
}
