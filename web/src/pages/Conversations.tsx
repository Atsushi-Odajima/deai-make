import { useNavigate } from 'react-router-dom';
import { useConversations } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconChevronLeft } from '../components/icons';
import { relativeTime } from '../lib/time';
import { useAuth } from '../store/auth';

export function Conversations() {
  const { data, isLoading } = useConversations();
  const navigate = useNavigate();
  const meId = useAuth((s) => s.user?.id);
  const convos = data?.conversations ?? [];

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate('/app/home')} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">メッセージ</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll">
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : convos.length === 0 ? (
          <div className="center-col">
            <div className="deck-empty-emoji">💬</div>
            <h3>メッセージはまだありません</h3>
            <p className="muted">気になる人のプロフィールから、気軽にDMを送ってみましょう。</p>
            <button className="btn btn-primary" onClick={() => navigate('/app/search')}>
              人をさがす
            </button>
          </div>
        ) : (
          <ul className="convo-list" style={{ padding: '4px 14px' }}>
            {convos.map((c) => {
              const mine = c.lastMessage?.senderId === meId;
              return (
                <li key={c.id}>
                  <button className="convo-item" onClick={() => navigate(`/app/dm/${c.id}`)}>
                    <Avatar src={c.user.avatar} name={c.user.displayName} size={56} />
                    <div className="convo-body">
                      <div className="convo-top">
                        <span className="convo-name">{c.user.displayName}</span>
                        {c.lastMessage && (
                          <span className="convo-time">{relativeTime(c.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      <div className="convo-bottom">
                        <span className={`convo-preview${c.unreadCount ? ' unread' : ''}`}>
                          {c.lastMessage ? `${mine ? 'あなた: ' : ''}${c.lastMessage.body}` : 'メッセージを送る'}
                        </span>
                        {c.unreadCount > 0 && <span className="convo-badge">{c.unreadCount}</span>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
