import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { Candidate, SwipeAction } from '../api/types';
import { IconBolt, IconCheck, IconPin } from './icons';

interface Props {
  candidate: Candidate;
  isTop: boolean;
  command: SwipeAction | null;
  onDecided: (action: SwipeAction, candidate: Candidate) => void;
  onOpenProfile?: (candidate: Candidate) => void;
}

const FLY = 700;

export function SwipeCard({ candidate, isTop, command, onDecided, onOpenProfile }: Props) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-16, 16]);
  const likeOpacity = useTransform(x, [30, 130], [0, 1]);
  const nopeOpacity = useTransform(x, [-30, -130], [0, 1]);
  const superOpacity = useTransform(y, [-60, -150], [0, 1]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [gone, setGone] = useState(false);

  const photos = candidate.photos.length ? candidate.photos : [''];

  function fly(action: SwipeAction) {
    if (gone) return;
    setGone(true);
    const opts = { duration: 0.32, ease: [0.22, 0.61, 0.36, 1] as const };
    if (action === 'superlike') {
      animate(y, -FLY * 1.4, opts);
      animate(x, x.get() * 1.2, opts);
    } else {
      animate(x, action === 'like' ? FLY : -FLY, opts);
      animate(y, 60, opts);
    }
    setTimeout(() => onDecided(action, candidate), 280);
  }

  // Buttons in the parent issue commands; the top card reacts.
  useEffect(() => {
    if (isTop && command) fly(command);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [command, isTop]);

  function onDragEnd(_: unknown, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) {
    const { offset, velocity } = info;
    if (offset.y < -130 && Math.abs(offset.x) < 110) return fly('superlike');
    if (offset.x > 120 || velocity.x > 650) return fly('like');
    if (offset.x < -120 || velocity.x < -650) return fly('pass');
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 32 });
    animate(y, 0, { type: 'spring', stiffness: 400, damping: 32 });
  }

  function tapPhoto(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio > 0.66) setPhotoIdx((i) => Math.min(i + 1, photos.length - 1));
    else if (ratio < 0.33) setPhotoIdx((i) => Math.max(i - 1, 0));
    else onOpenProfile?.(candidate);
  }

  return (
    <motion.div
      className="swipe-card"
      style={{ x, y, rotate, zIndex: isTop ? 2 : 1 }}
      drag={isTop ? true : false}
      dragSnapToOrigin={false}
      dragElastic={0.6}
      onDragEnd={onDragEnd}
      initial={isTop ? false : { scale: 0.94, y: 14 }}
      animate={isTop ? { scale: 1, y: 0 } : { scale: 0.94, y: 14 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="card-photo" onClick={tapPhoto}>
        <img src={photos[photoIdx]} alt={candidate.displayName} draggable={false} />
        <div className="card-photo-bars">
          {photos.map((_, i) => (
            <span key={i} className={i === photoIdx ? 'active' : ''} />
          ))}
        </div>
        <div className="card-gradient" />

        <motion.div className="stamp stamp-like" style={{ opacity: likeOpacity }}>
          LIKE
        </motion.div>
        <motion.div className="stamp stamp-nope" style={{ opacity: nopeOpacity }}>
          NOPE
        </motion.div>
        <motion.div className="stamp stamp-super" style={{ opacity: superOpacity }}>
          SUPER
        </motion.div>

        {candidate.superLikedYou ? (
          <div className="card-flag super">
            <IconBolt width={14} height={14} /> あなたにSuper Like
          </div>
        ) : candidate.likedYou ? (
          <div className="card-flag like">あなたをいいね済み</div>
        ) : null}

        <div className="card-info">
          <div className="card-name">
            <h2>
              {candidate.displayName}
              {candidate.age != null && <span className="card-age">{candidate.age}</span>}
            </h2>
            {candidate.verified && (
              <span className="verified-badge">
                <IconCheck width={11} height={11} />
              </span>
            )}
          </div>
          {candidate.headline && <p className="card-headline">{candidate.headline}</p>}
          <div className="card-meta">
            {candidate.location && (
              <span>
                <IconPin width={13} height={13} /> {candidate.location}
              </span>
            )}
            {candidate.sharedInterests > 0 && (
              <span className="card-shared">共通の趣味 {candidate.sharedInterests}</span>
            )}
          </div>
          {candidate.interests.length > 0 && (
            <div className="card-tags">
              {candidate.interests.slice(0, 4).map((t) => (
                <span key={t} className="card-tag">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
