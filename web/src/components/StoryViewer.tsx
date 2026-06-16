import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactStory, useStoryViewers, useViewStory } from '../api/hooks';
import type { StoryGroup } from '../api/types';
import { STORY_REACTIONS, reactionOf } from '../lib/reactions';
import { relativeTime } from '../lib/time';
import { Avatar } from './Avatar';
import { IconX } from './icons';

const DURATION = 5000;

interface Props {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
}

export function StoryViewer({ groups, startIndex, onClose }: Props) {
  const navigate = useNavigate();
  const view = useViewStory();
  const react = useReactStory();
  const [gi, setGi] = useState(startIndex);
  const [ii, setIi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const viewed = useRef<Set<string>>(new Set());

  const group = groups[gi];
  const item = group?.items[ii];
  const viewers = useStoryViewers(item?.id, !!group?.isSelf && showViewers);

  const next = useCallback(() => {
    setProgress(0);
    setIi((curII) => {
      const g = groups[gi];
      if (g && curII + 1 < g.items.length) return curII + 1;
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

  useEffect(() => {
    if (item && !viewed.current.has(item.id)) {
      viewed.current.add(item.id);
      if (!group.isSelf && !item.viewed) view.mutate(item.id);
    }
    setShowViewers(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const halted = paused || showViewers;
  useEffect(() => {
    if (halted || !item) return;
    const start = Date.now();
    const id = window.setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        window.clearInterval(id);
        next();
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [gi, ii, halted, item, next]);

  if (!group || !item) return null;

  function sendReaction(code: string) {
    if (!item) return;
    react.mutate({ storyId: item.id, reaction: item.myReaction === code ? null : code });
  }

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

        <button
          className="story-tap left"
          onClick={prev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label="前へ"
        />
        <button
          className="story-tap right"
          onClick={next}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label="次へ"
        />

        {/* Bottom controls: reactions for others, viewer count for your own. */}
        {group.isSelf ? (
          <button className="story-viewers-btn" onClick={() => setShowViewers(true)}>
            <span className="story-eye">👁</span> 閲覧者 {item.viewerCount}
          </button>
        ) : (
          <div className="story-reactions">
            {STORY_REACTIONS.map((r) => (
              <button
                key={r.code}
                className={`story-react${item.myReaction === r.code ? ' active' : ''}`}
                onClick={() => sendReaction(r.code)}
              >
                <span className="story-react-emoji">{r.emoji}</span>
                <span className="story-react-label">{r.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Viewer list panel (story owner only) */}
        <AnimatePresence>
          {showViewers && (
            <motion.div
              className="viewers-panel-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowViewers(false)}
            >
              <motion.div
                className="viewers-panel"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 360, damping: 36 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sheet-grab" />
                <h3 className="sheet-title">閲覧者 {item.viewerCount}</h3>
                <div className="viewers-list">
                  {viewers.data?.viewers.length === 0 && (
                    <p className="empty-line muted">まだ閲覧者はいません。</p>
                  )}
                  {viewers.data?.viewers.map((v) => {
                    const r = reactionOf(v.reaction);
                    return (
                      <button
                        key={v.user.id}
                        className="viewer-row"
                        onClick={() => {
                          onClose();
                          navigate(`/app/u/${v.user.username}`);
                        }}
                      >
                        <Avatar src={v.user.avatar} name={v.user.displayName} size={42} />
                        <div className="viewer-text">
                          <span className="viewer-name">{v.user.displayName}</span>
                          <span className="viewer-handle">@{v.user.username}</span>
                        </div>
                        {r && (
                          <span className="viewer-reaction">
                            {r.emoji}
                            <span>{r.label}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
