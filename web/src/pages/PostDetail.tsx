import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAddComment, usePost, usePostComments } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { IconChevronLeft } from '../components/icons';
import { relativeTime } from '../lib/time';

export function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = usePost(postId);
  const comments = usePostComments(postId);
  const add = useAddComment(postId ?? '');
  const [text, setText] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    add.mutate(body);
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">投稿</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll" style={{ paddingBottom: 8 }}>
        {isLoading || !data ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <PostCard post={data.post} />
            <div className="comment-list">
              {comments.data?.comments.map((c) => (
                <div key={c.id} className="comment">
                  <Avatar src={c.author.avatar} name={c.author.displayName} size={34} />
                  <div className="comment-body">
                    <p>
                      <button
                        className="post-caption-user"
                        onClick={() => navigate(`/app/u/${c.author.username}`)}
                      >
                        {c.author.username}
                      </button>{' '}
                      {c.body}
                    </p>
                    <time className="comment-time">{relativeTime(c.createdAt)}</time>
                  </div>
                </div>
              ))}
              {comments.data?.comments.length === 0 && (
                <p className="empty-line muted">最初のコメントを書いてみましょう。</p>
              )}
            </div>
          </>
        )}
      </div>

      <form className="chat-input-bar" onSubmit={submit}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="コメントを追加…"
          maxLength={1000}
        />
        <button className="chat-send" disabled={!text.trim()} aria-label="送信">
          <span style={{ fontWeight: 700, fontSize: 14 }}>投稿</span>
        </button>
      </form>
    </div>
  );
}
