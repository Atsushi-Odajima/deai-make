import { useNavigate } from 'react-router-dom';
import { IconCheck, IconLogout, IconPin, IconSettings } from '../components/icons';
import { closeSocket } from '../lib/socket';
import { useAuth } from '../store/auth';

export function Profile() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const navigate = useNavigate();

  if (!user) return null;

  function doLogout() {
    closeSocket();
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="screen-inner">
      <header className="topbar">
        <span className="page-title">プロフィール</span>
        <div className="topbar-actions">
          <button
            className="icon-btn"
            onClick={() => navigate('/app/settings')}
            aria-label="設定"
          >
            <IconSettings width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="profile-hero">
        <div
          className="profile-cover"
          style={{ backgroundImage: user.photos[0] ? `url(${user.photos[0]})` : undefined }}
        >
          <div className="profile-cover-shade" />
        </div>
        <div className="profile-identity">
          <h1>
            {user.displayName}
            {user.age != null && <span className="profile-age">{user.age}</span>}
            {user.verified && (
              <span className="verified-badge" style={{ width: 22, height: 22 }}>
                <IconCheck width={13} height={13} />
              </span>
            )}
          </h1>
          {user.headline && <p className="profile-headline">{user.headline}</p>}
          {user.location && (
            <p className="profile-loc">
              <IconPin width={14} height={14} /> {user.location}
            </p>
          )}
        </div>
      </div>

      <button className="btn btn-primary btn-block" onClick={() => navigate('/app/edit')}>
        プロフィールを編集
      </button>

      {user.bio && (
        <section className="profile-section">
          <h4 className="section-label">自己紹介</h4>
          <p className="profile-bio">{user.bio}</p>
        </section>
      )}

      {user.interests.length > 0 && (
        <section className="profile-section">
          <h4 className="section-label">趣味・関心</h4>
          <div className="chip-row">
            {user.interests.map((t) => (
              <span key={t} className="chip selected">
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {user.photos.length > 1 && (
        <section className="profile-section">
          <h4 className="section-label">写真</h4>
          <div className="profile-photos">
            {user.photos.map((p, i) => (
              <img key={i} src={p} alt="" />
            ))}
          </div>
        </section>
      )}

      <button className="btn btn-ghost btn-block profile-logout" onClick={doLogout}>
        <IconLogout width={18} height={18} /> ログアウト
      </button>
    </div>
  );
}
