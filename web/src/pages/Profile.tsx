import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlock, useFollow, useOpenConversation, useProfile, useUserPosts } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import {
  IconChevronLeft,
  IconGrid,
  IconLink,
  IconMore,
  IconPin,
  IconSettings,
} from '../components/icons';
import { useAuth } from '../store/auth';

export function Profile() {
  const { username } = useParams();
  const me = useAuth((s) => s.user);
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  const key = username ?? me?.username;
  const { data, isLoading } = useProfile(key);
  const user = data?.user;
  const isOwn = !!user && user.id === me?.id;
  const posts = useUserPosts(user?.id);

  const follow = useFollow();
  const openConv = useOpenConversation();
  const block = useBlock();
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  function toggleFollow() {
    if (!user) return;
    follow.mutate({ userId: user.id, following: user.isFollowing });
  }
  function message() {
    if (!user) return;
    openConv.mutate(user.id, {
      onSuccess: ({ conversation }) => navigate(`/app/dm/${conversation.id}`),
    });
  }

  if (isLoading || !user) {
    return (
      <div className="screen-inner">
        <div className="center-col">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="screen-inner flush">
      <header className="topbar">
        {username && !isOwn ? (
          <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
            <IconChevronLeft />
          </button>
        ) : (
          <span style={{ width: 40 }} />
        )}
        <span className="profile-handle">
          {user.username}
          {user.verified && <span className="mini-verified">✓</span>}
        </span>
        {isOwn ? (
          <button className="icon-btn" onClick={() => navigate('/app/settings')} aria-label="設定">
            <IconSettings width={22} height={22} />
          </button>
        ) : (
          <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="メニュー">
            <IconMore width={22} height={22} />
          </button>
        )}
      </header>

      <div className="profile-top">
        <Avatar src={user.photos[0]} name={user.displayName} size={86} ring />
        <div className="profile-stats">
          <div className="stat">
            <strong>{user.postsCount}</strong>
            <span>投稿</span>
          </div>
          <div className="stat">
            <strong>{user.followersCount}</strong>
            <span>フォロワー</span>
          </div>
          <div className="stat">
            <strong>{user.followingCount}</strong>
            <span>フォロー中</span>
          </div>
        </div>
      </div>

      <div className="profile-meta">
        <div className="profile-displayname">
          {user.displayName}
          {user.age != null && <span className="profile-age-inline">{user.age}</span>}
          {user.pronouns && <span className="profile-pronouns">{user.pronouns}</span>}
        </div>
        {user.headline && <div className="profile-headline-text">{user.headline}</div>}
        {user.bio && <p className="profile-bio-text">{user.bio}</p>}
        <div className="profile-extra">
          {user.location && (
            <span>
              <IconPin width={13} height={13} /> {user.location}
            </span>
          )}
          {user.link && (
            <a
              href={user.link.startsWith('http') ? user.link : `https://${user.link}`}
              target="_blank"
              rel="noreferrer"
              className="profile-link"
            >
              <IconLink width={13} height={13} /> {user.link}
            </a>
          )}
        </div>
        {user.interests.length > 0 && (
          <div className="chip-row" style={{ marginTop: 12 }}>
            {user.interests.map((t) => (
              <span key={t} className="chip selected sm">
                {t}
              </span>
            ))}
          </div>
        )}
        {!isOwn && user.followsYou && <div className="follows-you-line">あなたをフォローしています</div>}
      </div>

      <div className="profile-buttons">
        {isOwn ? (
          <>
            <button className="btn btn-subtle btn-block" onClick={() => navigate('/app/edit')}>
              プロフィールを編集
            </button>
            <button className="btn btn-subtle" onClick={() => navigate('/app/create')}>
              投稿
            </button>
          </>
        ) : (
          <>
            <button
              className={`btn btn-block ${user.isFollowing ? 'btn-subtle' : 'btn-primary'}`}
              onClick={toggleFollow}
              disabled={follow.isPending}
            >
              {user.isFollowing ? 'フォロー中' : user.followsYou ? 'フォローバック' : 'フォロー'}
            </button>
            <button className="btn btn-subtle btn-block" onClick={message} disabled={openConv.isPending}>
              メッセージ
            </button>
          </>
        )}
      </div>

      <div className="profile-grid-head">
        <IconGrid width={20} height={20} />
      </div>
      {posts.data && posts.data.posts.length > 0 ? (
        <div className="explore-grid tight">
          {posts.data.posts.map((p) => (
            <button key={p.id} className="explore-cell" onClick={() => navigate(`/app/post/${p.id}`)}>
              <img src={p.imageUrl} alt={p.caption} />
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-line muted" style={{ textAlign: 'center' }}>
          まだ投稿はありません。
        </p>
      )}

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={user.displayName}>
        <button
          className="sheet-action"
          onClick={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
        >
          通報する
        </button>
        <button
          className="sheet-action danger"
          onClick={() => {
            setMenuOpen(false);
            block.mutate(user.id, {
              onSuccess: () => {
                show(`${user.displayName}さんをブロックしました`);
                navigate(-1);
              },
            });
          }}
        >
          ブロックする
        </button>
      </Sheet>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        userId={user.id}
        userName={user.displayName}
      />
    </div>
  );
}
