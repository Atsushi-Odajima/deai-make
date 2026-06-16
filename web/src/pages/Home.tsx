import { useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import {
  useBlock,
  useConversations,
  useCreateStory,
  useFeed,
  useStoryFeed,
  useUnreadNotifications,
} from '../api/hooks';
import type { Post } from '../api/types';
import { Avatar } from '../components/Avatar';
import { PostCard } from '../components/PostCard';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { StoryViewer } from '../components/StoryViewer';
import { useToast } from '../components/Toast';
import { IconDM, IconHeart, IconPlus } from '../components/icons';
import { fileToDataUrl } from '../lib/image';
import { useAuth } from '../store/auth';

export function Home() {
  const me = useAuth((s) => s.user);
  const { data, isLoading } = useFeed();
  const stories = useStoryFeed();
  const convos = useConversations();
  const unread = useUnreadNotifications();
  const createStory = useCreateStory();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const block = useBlock();
  const storyInput = useRef<HTMLInputElement>(null);

  const [menuPost, setMenuPost] = useState<Post | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const dmUnread = convos.data?.conversations.reduce((s, c) => s + c.unreadCount, 0) ?? 0;
  const notifUnread = unread.data?.count ?? 0;
  const posts = data?.posts ?? [];
  const groups = stories.data?.groups ?? [];
  const selfGroup = groups.find((g) => g.isSelf);

  async function addStory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      await createStory.mutateAsync({ imageUrl: await fileToDataUrl(file) });
      show('ストーリーズに追加しました');
    }
    if (storyInput.current) storyInput.current.value = '';
  }

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
          <button className="icon-btn badge" onClick={() => navigate('/app/notifications')} aria-label="お知らせ">
            <IconHeart width={22} height={22} />
            {notifUnread > 0 && <span className="dot" />}
          </button>
          <button className="icon-btn badge" onClick={() => navigate('/app/dm')} aria-label="メッセージ">
            <IconDM width={22} height={22} />
            {dmUnread > 0 && <span className="dot" />}
          </button>
        </div>
      </header>

      <div className="stories-rail">
        {/* Your story: tap ring to view, + to add. */}
        <button
          className="story"
          onClick={() => (selfGroup ? setViewerIndex(groups.indexOf(selfGroup)) : storyInput.current?.click())}
        >
          <span className={`story-ring${selfGroup?.hasUnseen ? '' : ' seen'} self`}>
            <Avatar src={me?.photos[0]} name={me?.displayName ?? ''} size={60} />
            <span
              className="story-add"
              onClick={(e) => {
                e.stopPropagation();
                storyInput.current?.click();
              }}
            >
              <IconPlus width={14} height={14} strokeWidth={3} />
            </span>
          </span>
          <span className="story-name">あなた</span>
        </button>

        {groups
          .filter((g) => !g.isSelf)
          .map((g) => {
            const idx = groups.indexOf(g);
            return (
              <button key={g.user.id} className="story" onClick={() => setViewerIndex(idx)}>
                <span className={`story-ring${g.hasUnseen ? '' : ' seen'}`}>
                  <Avatar src={g.user.avatar} name={g.user.displayName} size={60} />
                </span>
                <span className="story-name">{g.user.username}</span>
              </button>
            );
          })}
      </div>

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

      <input ref={storyInput} type="file" accept="image/*" hidden onChange={addStory} />

      {viewerIndex !== null && groups[viewerIndex] && (
        <StoryViewer groups={groups} startIndex={viewerIndex} onClose={() => setViewerIndex(null)} />
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
            <button className="sheet-action" onClick={() => setReportOpen(true)}>
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
