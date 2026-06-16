import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewStory } from '../api/hooks';
import type { StoryGroup } from '../api/types';
import { Avatar } from './Avatar';
import { IconX } from './icons';
import { relativeTime } from '../lib/time';

const DURATION = 5000;

interface Props {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ groups, startIndex, onClose }: Props) {
  const navigate = useNavigate();
  const view = useViewStory();
  const [gi, setGi] = useState(startIndex);
  const [ii, setIi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const viewed = useRef<Set<string>>(new Set());

  const group = groups[gi];
  const item = group?.items[ii];

  const next = useCallback(() => {
    setProgress(0);
    setIi((curII) => {
      const g = groups[gi];
      if (g && curII + 1 < g.items.length) return curII + 1;
      // advance to next group
      setGi((curGI) => {
        if (curGI + 1 < groups.length) return curGI + 1;
        onClose();
        return curGI;
      });
      return 0;
    });
  }, [gi, groups, onClose]);

  const prev = useCallback(() => {
    setProgress(0);
    setIi((curII) => {
      if (curII > 0) return curII - 1;
      setGi((curGI) => Math.max(0, curGI - 1));
      return 0;
    });
  }, []);

  // Mark the active story as viewed (once).
  useEffect(() => {
    if (item && !viewed.current.has(item.id)) {
      viewed.current.add(item.id);
      if (!group.isSelf && !item.viewed) view.mutate(item.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Auto-advance timer.
  useEffect(() => {
    if (paused || !item) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(100, (elapsed / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(id);
        next();
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [gi, ii, paused, item, next]);

  if (!group || !item) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.img
          key={item.id}
          className="story-media"
          src={item.imageUrl}
          alt=""
          initial={{ opacity: 0.4, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        <div className="story-bars">
          {group.items.map((s, idx) => (
            <span key={s.id} className="story-bar">
              <span
                className="story-bar-fill"
                style={{ width: idx < ii ? '100%' : idx === ii ? `${progress}%` : '0%' }}
              />
            </span>
          ))}
        </div>

        <div className="story-top">
          <button
            className="story-user"
            onClick={() => {
              onClose();
              navigate(`/app/u/${group.user.username}`);
            }}
          >
            <Avatar src={group.user.avatar} name={group.user.displayName} size={34} />
            <span className="story-username">{group.user.displayName}</span>
            <span className="story-time">{relativeTime(item.createdAt)}</span>
          </button>
          <button className="story-close" onClick={onClose} aria-label="閉じる">
            <IconX width={24} height={24} />
          </button>
        </div>

        {item.caption && <div className="story-caption">{item.caption}</div>}

        {/* Tap zones: left = back, right = forward; hold to pause. */}
        <button
          className="story-tap left"
          onClick={prev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          aria-label="前へ"
        />
        <button
          className="story-tap right"
          onClick={next}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          aria-label="次へ"
        />
      </motion.div>
    </AnimatePresence>
  );
}
