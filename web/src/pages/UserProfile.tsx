import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlock, useProfile, useSwipe } from '../api/hooks';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { IconBolt, IconCheck, IconChevronLeft, IconHeart, IconPin } from '../components/icons';

export function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProfile(userId);
  const swipe = useSwipe();
  const block = useBlock();
  const qc = useQueryClient();
  const show = useToast((s) => s.show);

  const [photoIdx, setPhotoIdx] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const user = data?.user;

  function like(action: 'like' | 'superlike') {
    if (!user) return;
    swipe.mutate(
      { targetId: user.id, action },
      {
        onSuccess: (res) => {
          qc.invalidateQueries({ queryKey: ['discovery'] });
          qc.invalidateQueries({ queryKey: ['matches'] });
          show(res.matched ? `${user.displayName} とマッチしました！` : 'いいねを送りました');
          if (res.matched && res.match) navigate(`/app/chat/${res.match.id}`);
        },
      },
    );
  }

  function doBlock() {
    if (!user) return;
    block.mutate(user.id, {
      onSuccess: () => {
        show(`${user.displayName}さんをブロックしました`);
        navigate(-1);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="screen">
        <div className="center-col">
          <div className="spinner" />
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="screen">
        <div className="center-col">
          <p className="muted">プロフィールが見つかりませんでした。</p>
          <button className="btn btn-subtle" onClick={() => navigate(-1)}>
            戻る
          </button>
        </div>
      </div>
    );
  }

  const photos = user.photos.length ? user.photos : [''];

  return (
    <div className="screen subpage">
      <div className="screen-scroll" style={{ paddingBottom: 110 }}>
        <div className="up-photo" onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}>
          <img src={photos[photoIdx]} alt={user.displayName} />
          <div className="card-photo-bars">
            {photos.map((_, i) => (
              <span key={i} className={i === photoIdx ? 'active' : ''} />
            ))}
          </div>
          <div className="card-gradient" />
          <button
            className="icon-btn up-back"
            onClick={(e) => {
              e.stopPropagation();
              navigate(-1);
            }}
            aria-label="戻る"
          >
            <IconChevronLeft />
          </button>
          <div className="up-name-overlay">
            <h1>
              {user.displayName}
              {user.age != null && <span className="profile-age">{user.age}</span>}
              {user.verified && (
                <span className="verified-badge" style={{ width: 22, height: 22 }}>
                  <IconCheck width={13} height={13} />
                </span>
              )}
            </h1>
            {user.location && (
              <p className="up-loc">
                <IconPin width={14} height={14} /> {user.location}
                {user.pronouns && ` · ${user.pronouns}`}
              </p>
            )}
          </div>
        </div>

        <div className="up-body">
          {user.headline && <p className="up-headline">{user.headline}</p>}
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
          <button className="up-report-link" onClick={() => setMenuOpen(true)}>
            通報・ブロック
          </button>
        </div>
      </div>

      <div className="up-actions">
        <button className="action-btn super" onClick={() => like('superlike')} aria-label="スーパーいいね">
          <IconBolt width={24} height={24} />
        </button>
        <button className="action-btn like big" onClick={() => like('like')} aria-label="いいね">
          <IconHeart width={30} height={30} />
        </button>
      </div>

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
            doBlock();
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
