import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useBlock, useConversations, useFeed, useSuggestedUsers } from '../api/hooks';
import type { Post } from '../api/types';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { IconDM } from '../components/icons';
import { useAuth } from '../store/auth';

export function Home() {
  const me = useAuth((s) => s.user);
  const { data, isLoading } = useFeed();
  const suggested = useSuggestedUsers();
  const convos = useConversations();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const block = useBlock();

  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const unread = convos.data?.conversations.reduce((s, c) => s + c.unreadCount, 0) ?? 0;
  const posts = data?.posts ?? [];

  async function deletePost(post: Post) {
    await api.delete(`/posts/${post.id}`);
    qc.invalidateQueries({ queryKey: ['feed'] });
    qc.invalidateQueries({ queryKey: ['user-posts'] });
    show('投稿を削除しました');
  }

  return (
    <div className="screen-inner flush">
      <header className="topbar">
        <span className="wordmark">Mingle</span>
        <div className="topbar-actions">
          <button className="icon-btn badge" onClick={() => navigate('/app/dm')} aria-label="メッセージ">
            <IconDM width={22} height={22} />
            {unread > 0 && <span className="dot" />}
          </button>
        </div>
      </header>

      {(suggested.data?.users.length ?? 0) > 0 && (
        <div className="stories-rail">
          {suggested.data!.users.map((u) => (
            <button key={u.id} className="story" onClick={() => navigate(`/app/u/${u.username}`)}>
              <span className="story-ring">
                <Avatar src={u.photos[0]} name={u.displayName} size={60} />
              </span>
              <span className="story-name">{u.username}</span>
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="center-col">
          <div className="spinner" />
        </div>
      ) : posts.length === 0 ? (
        <div className="center-col">
          <div className="deck-empty-emoji">📷</div>
          <h3>フィードはまだ空っぽ</h3>
          <p className="muted">気になる人をフォローしたり、最初の投稿をしてみましょう。</p>
          <button className="btn btn-primary" onClick={() => navigate('/app/search')}>
            人をさがす
          </button>
        </div>
      ) : (
        <div className="feed">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onMore={setMenuPost} />
          ))}
        </div>
      )}

      <Sheet open={!!menuPost} onClose={() => setMenuPost(null)} title={menuPost?.author.displayName}>
        <button
          className="sheet-action"
          onClick={() => {
            const p = menuPost;
            setMenuPost(null);
            if (p) navigate(`/app/u/${p.author.username}`);
          }}
        >
          プロフィールを見る
        </button>
        {menuPost?.author.id === me?.id ? (
          <button
            className="sheet-action danger"
            onClick={() => {
              const p = menuPost;
              setMenuPost(null);
              if (p) deletePost(p);
            }}
          >
            投稿を削除
          </button>
        ) : (
          <>
            <button
              className="sheet-action"
              onClick={() => {
                setReportOpen(true);
              }}
            >
              通報する
            </button>
            <button
              className="sheet-action danger"
              onClick={() => {
                const p = menuPost;
                setMenuPost(null);
                if (p)
                  block.mutate(p.author.id, {
                    onSuccess: () => show(`${p.author.displayName}さんをブロックしました`),
                  });
              }}
            >
              ブロックする
            </button>
          </>
        )}
      </Sheet>

      {menuPost && (
        <ReportSheet
          open={reportOpen}
          onClose={() => {
            setReportOpen(false);
            setMenuPost(null);
          }}
          userId={menuPost.author.id}
          userName={menuPost.author.displayName}
        />
      )}
    </div>
  );
}
