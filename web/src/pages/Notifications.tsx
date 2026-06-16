import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../api/hooks';
import type { AppNotification } from '../api/types';
import { Avatar } from '../components/Avatar';
import { IconChevronLeft } from '../components/icons';
import { relativeTime } from '../lib/time';

const TEXT: Record<AppNotification['type'], string> = {
  follow: 'あなたをフォローしました',
  like: 'あなたの投稿にいいねしました',
  comment: 'あなたの投稿にコメントしました',
  board_comment: 'あなたのスレッドにコメントしました',
};

export function Notifications() {
  const { data, isLoading } = useNotifications();
  const navigate = useNavigate();
  const items = data?.notifications ?? [];

  function open(n: AppNotification) {
    if (n.type === 'follow') navigate(`/app/u/${n.actor.username}`);
    else if (n.type === 'board_comment') navigate(`/app/board/${n.entityId}`);
    else navigate(`/app/post/${n.entityId}`);
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate('/app/home')} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">お知らせ</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll">
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="center-col">
            <div className="deck-empty-emoji">🔔</div>
            <h3>お知らせはありません</h3>
            <p className="muted">フォロー・いいね・コメントがあるとここに表示されます。</p>
          </div>
        ) : (
          <ul className="notif-list">
            {items.map((n) => (
              <li key={n.id}>
                <div
                  className={`notif-item${n.read ? '' : ' unread'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => open(n)}
                >
                  <span
                    className="notif-avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/app/u/${n.actor.username}`);
                    }}
                  >
                    <Avatar src={n.actor.avatar} name={n.actor.displayName} size={48} />
                  </span>
                  <div className="notif-text">
                    <span>
                      <strong>{n.actor.displayName}</strong>さんが{TEXT[n.type]}
                    </span>
                    <time>{relativeTime(n.createdAt)}</time>
                  </div>
                  {n.preview ? (
                    <img className="notif-preview" src={n.preview} alt="" />
                  ) : (
                    !n.read && <span className="notif-dot" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
