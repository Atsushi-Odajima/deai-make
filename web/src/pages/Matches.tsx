import { useNavigate } from 'react-router-dom';
import { useMatches } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconBolt } from '../components/icons';
import { relativeTime } from '../lib/time';
import { useAuth } from '../store/auth';

export function Matches() {
  const { data, isLoading } = useMatches();
  const navigate = useNavigate();
  const meId = useAuth((s) => s.user?.id);

  const matches = data?.matches ?? [];
  const fresh = matches.filter((m) => !m.lastMessage);
  const convos = matches.filter((m) => m.lastMessage);

  return (
    <div className="screen-inner">
      <header className="topbar">
        <span className="page-title">トーク</span>
      </header>

      {isLoading ? (
        <div className="center-col">
          <div className="spinner" />
        </div>
      ) : matches.length === 0 ? (
        <div className="center-col">
          <div className="deck-empty-emoji">✨</div>
          <h3>まだマッチはありません</h3>
          <p className="muted">「見つける」でスワイプして、最初のつながりを作りましょう。</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/discover')}>
            人をさがす
          </button>
        </div>
      ) : (
        <>
          {fresh.length > 0 && (
            <section className="match-rail-section">
              <h4 className="section-label">新しいマッチ</h4>
              <div className="match-rail">
                {fresh.map((m) => (
                  <button
                    key={m.id}
                    className="rail-item"
                    onClick={() => navigate(`/app/chat/${m.id}`)}
                  >
                    <div className="rail-avatar">
                      <Avatar src={m.user.photos[0]} name={m.user.displayName} size={64} ring />
                      {m.isSuper && (
                        <span className="rail-super">
                          <IconBolt width={11} height={11} />
                        </span>
                      )}
                    </div>
                    <span className="rail-name">{m.user.displayName}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h4 className="section-label">メッセージ</h4>
            {convos.length === 0 ? (
              <p className="empty-line muted">会話を始めてみましょう 👋</p>
            ) : (
              <ul className="convo-list">
                {convos.map((m) => {
                  const mine = m.lastMessage?.senderId === meId;
                  return (
                    <li key={m.id}>
                      <button className="convo-item" onClick={() => navigate(`/app/chat/${m.id}`)}>
                        <Avatar src={m.user.photos[0]} name={m.user.displayName} size={56} />
                        <div className="convo-body">
                          <div className="convo-top">
                            <span className="convo-name">{m.user.displayName}</span>
                            <span className="convo-time">
                              {relativeTime(m.lastMessage!.createdAt)}
                            </span>
                          </div>
                          <div className="convo-bottom">
                            <span className={`convo-preview${m.unreadCount ? ' unread' : ''}`}>
                              {mine && 'あなた: '}
                              {m.lastMessage!.body}
                            </span>
                            {m.unreadCount > 0 && (
                              <span className="convo-badge">{m.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
