import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAddBoardComment, useBoardComments, useBoardPost, useOpenConversation } from '../api/hooks';
import { Avatar } from '../components/Avatar';
import { IconChevronLeft, IconDM } from '../components/icons';
import { categoryMeta } from '../lib/board';
import { relativeTime } from '../lib/time';
import { useAuth } from '../store/auth';

export function BoardThread() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const meId = useAuth((s) => s.user?.id);
  const { data, isLoading } = useBoardPost(boardId);
  const comments = useBoardComments(boardId);
  const add = useAddBoardComment(boardId ?? '');
  const openConv = useOpenConversation();
  const [text, setText] = useState('');

  const post = data?.post;

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    add.mutate(body);
  }

  function dm() {
    if (!post) return;
    openConv.mutate(post.author.id, {
      onSuccess: ({ conversation }) => navigate(`/app/dm/${conversation.id}`),
    });
  }

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">スレッド</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll">
        {isLoading || !post ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : (
          <>
            <div className="thread-head">
              <span className="board-tag">
                {categoryMeta(post.category).emoji} {categoryMeta(post.category).label}
              </span>
              <h1 className="thread-title">{post.title}</h1>
              <button
                className="thread-author"
                onClick={() => navigate(`/app/u/${post.author.username}`)}
              >
                <Avatar src={post.author.avatar} name={post.author.displayName} size={34} />
                <div>
                  <div className="thread-author-name">{post.author.displayName}</div>
                  <div className="thread-time muted">{relativeTime(post.createdAt)}</div>
                </div>
              </button>
              {post.body && <p className="thread-body">{post.body}</p>}
              {post.author.id !== meId && (
                <button className="btn btn-subtle" onClick={dm} style={{ marginTop: 12 }}>
                  <IconDM width={17} height={17} /> 投稿者にDM
                </button>
              )}
            </div>

            <div className="thread-comments">
              <h4 className="section-label">コメント {comments.data?.comments.length ?? 0}</h4>
              {comments.data?.comments.map((c) => (
                <div key={c.id} className="comment">
                  <Avatar src={c.author.avatar} name={c.author.displayName} size={34} />
                  <div className="comment-body">
                    <p>
                      <button
                        className="post-caption-user"
                        onClick={() => navigate(`/app/u/${c.author.username}`)}
                      >
                        {c.author.displayName}
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
          <span style={{ fontWeight: 700, fontSize: 14 }}>送信</span>
        </button>
      </form>
    </div>
  );
}
