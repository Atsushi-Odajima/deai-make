import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useIncomingLikes, useSwipe } from '../api/hooks';
import type { IncomingLike } from '../api/types';
import { useToast } from '../components/Toast';
import { IconBolt, IconCheck, IconHeart } from '../components/icons';

export function LikesYou() {
  const { data, isLoading } = useIncomingLikes();
  const swipe = useSwipe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  function likeBack(person: IncomingLike) {
    swipe.mutate(
      { targetId: person.id, action: 'like' },
      {
        onSuccess: (res) => {
          qc.invalidateQueries({ queryKey: ['likes'] });
          qc.invalidateQueries({ queryKey: ['matches'] });
          if (res.matched) show(`${person.displayName} とマッチしました！`);
        },
      },
    );
  }

  const likes = data?.likes ?? [];

  return (
    <div className="screen-inner">
      <header className="topbar">
        <span className="page-title">あなたへのいいね</span>
      </header>

      {isLoading ? (
        <div className="center-col">
          <div className="spinner" />
        </div>
      ) : likes.length === 0 ? (
        <div className="center-col">
          <div className="deck-empty-emoji">💙</div>
          <h3>まだいいねはありません</h3>
          <p className="muted">スワイプを続けると、誰かからのいいねがここに届きます。</p>
        </div>
      ) : (
        <>
          <p className="likes-caption">
            {likes.length}人があなたに興味を持っています。いいねを返すとマッチします。
          </p>
          <div className="likes-grid">
            {likes.map((person) => (
              <div key={person.id} className="like-tile">
                <div className="like-tile-photo" onClick={() => navigate(`/app/u/${person.id}`)}>
                  <img src={person.photos[0]} alt={person.displayName} />
                  <div className="card-gradient" />
                  {person.isSuper && (
                    <span className="like-super">
                      <IconBolt width={12} height={12} /> Super Like
                    </span>
                  )}
                  <div className="like-tile-info">
                    <span>
                      {person.displayName}
                      {person.age != null && `, ${person.age}`}
                    </span>
                    {person.verified && (
                      <span className="verified-badge">
                        <IconCheck width={10} height={10} />
                      </span>
                    )}
                  </div>
                </div>
                <button className="like-back-btn" onClick={() => likeBack(person)}>
                  <IconHeart width={18} height={18} /> いいねを返す
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
