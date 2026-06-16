import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToggleLike } from '../api/hooks';
import type { Post } from '../api/types';
import { relativeTime } from '../lib/time';
import { Avatar } from './Avatar';
import { IconComment, IconDM, IconHeart, IconHeartFilled, IconMore } from './icons';

export function PostCard({ post, onMore }: { post: Post; onMore?: (post: Post) => void }) {
  const navigate = useNavigate();
  const toggle = useToggleLike();
  const [burst, setBurst] = useState(false);
  const lastTap = useRef(0);

  function like() {
    if (!post.likedByMe) toggle.mutate({ postId: post.id, liked: false });
  }
  function toggleLike() {
    toggle.mutate({ postId: post.id, liked: post.likedByMe });
  }
  function onImageTap() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      like();
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    lastTap.current = now;
  }

  return (
    <article className="post-card">
      <header className="post-head">
        <button className="post-author" onClick={() => navigate(`/app/u/${post.author.username}`)}>
          <Avatar src={post.author.avatar} name={post.author.displayName} size={36} ring />
          <div className="post-author-text">
            <span className="post-username">
              {post.author.username}
              {post.author.verified && <span className="mini-verified">✓</span>}
            </span>
            <span className="post-name">{post.author.displayName}</span>
          </div>
        </button>
        <button className="icon-btn ghost" onClick={() => onMore?.(post)} aria-label="メニュー">
          <IconMore width={20} height={20} />
        </button>
      </header>

      <div className="post-image" onClick={onImageTap} onDoubleClick={like}>
        <img src={post.imageUrl} alt={post.caption} draggable={false} />
        <AnimatePresence>
          {burst && (
            <motion.div
              className="like-burst"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            >
              <IconHeartFilled width={96} height={96} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="post-actions">
        <button className={`post-act${post.likedByMe ? ' liked' : ''}`} onClick={toggleLike} aria-label="いいね">
          {post.likedByMe ? <IconHeartFilled width={26} height={26} /> : <IconHeart width={26} height={26} />}
        </button>
        <button className="post-act" onClick={() => navigate(`/app/post/${post.id}`)} aria-label="コメント">
          <IconComment width={25} height={25} />
        </button>
        <button
          className="post-act"
          onClick={() => navigate(`/app/u/${post.author.username}`)}
          aria-label="送る"
        >
          <IconDM width={25} height={25} />
        </button>
      </div>

      <div className="post-body">
        {post.likeCount > 0 && <div className="post-likes">いいね {post.likeCount}件</div>}
        {post.caption && (
          <p className="post-caption">
            <button
              className="post-caption-user"
              onClick={() => navigate(`/app/u/${post.author.username}`)}
            >
              {post.author.username}
            </button>{' '}
            {post.caption}
          </p>
        )}
        {post.commentCount > 0 && (
          <button className="post-comments-link" onClick={() => navigate(`/app/post/${post.id}`)}>
            コメント{post.commentCount}件を見る
          </button>
        )}
        <time className="post-time">{relativeTime(post.createdAt)}</time>
      </div>
    </article>
  );
}
