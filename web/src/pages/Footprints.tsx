import { useNavigate } from 'react-router-dom';
import { useFollow, useFootprints } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconChevronLeft } from '../components/icons';

export function Footprints() {
  const { data, isLoading } = useFootprints();
  const follow = useFollow();
  const navigate = useNavigate();
  const users = data?.users ?? [];

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">あしあと</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll">
        <p className="archive-note muted">最近あなたのプロフィールを訪れた人（最大20人）。</p>
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : users.length === 0 ? (
          <div className="center-col">
            <div className="deck-empty-emoji">👣</div>
            <h3>あしあとはまだありません</h3>
            <p className="muted">誰かがあなたのプロフィールを見ると、ここに表示されます。</p>
          </div>
        ) : (
          <div className="user-results">
            {users.map((u) => (
              <div key={u.id} className="user-row footprint-row">
                <button
                  className="footprint-main"
                  onClick={() => navigate(`/app/u/${u.username}`)}
                >
                  <Avatar src={u.photos[0]} name={u.displayName} size={48} />
                  <div className="user-row-text">
                    <span className="user-row-username">
                      {u.username}
                      {u.verified && <span className="mini-verified">✓</span>}
                    </span>
                    <span className="user-row-name">{u.displayName}</span>
                  </div>
                </button>
                <button
                  className={`btn ${u.isFollowing ? 'btn-subtle' : 'btn-primary'} footprint-follow`}
                  onClick={() => follow.mutate({ userId: u.id, following: u.isFollowing })}
                >
                  {u.isFollowing ? 'フォロー中' : 'フォロー'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
