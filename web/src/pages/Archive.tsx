import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoryArchive } from '../api/hooks';
import type { StoryGroup } from '../api/types';
import { StoryViewer } from '../components/StoryViewer';
import { IconChevronLeft } from '../components/icons';
import { useAuth } from '../store/auth';

export function Archive() {
  const { data, isLoading } = useStoryArchive();
  const navigate = useNavigate();
  const me = useAuth((s) => s.user);
  const [openAt, setOpenAt] = useState<number | null>(null);

  const items = data?.items ?? [];

  const group: StoryGroup | null = me
    ? {
        user: {
          id: me.id,
          username: me.username,
          displayName: me.displayName,
          avatar: me.photos[0] ?? '',
          verified: me.verified,
        },
        items: items.map((i) => ({
          id: i.id,
          imageUrl: i.imageUrl,
          caption: i.caption,
          createdAt: i.createdAt,
          viewed: true,
          myReaction: null,
          viewerCount: i.viewerCount,
        })),
        hasUnseen: false,
        isSelf: true,
      }
    : null;

  return (
    <div className="screen subpage">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <span className="subpage-title">ストーリーズアーカイブ</span>
        <span style={{ width: 40 }} />
      </header>

      <div className="screen-scroll">
        <p className="archive-note muted">
          過去のストーリーズはここに自動で保存されます（あなただけが閲覧できます）。
        </p>
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : items.length === 0 ? (
          <div className="center-col">
            <div className="deck-empty-emoji">🗂</div>
            <h3>アーカイブは空です</h3>
            <p className="muted">ストーリーズを投稿すると、ここに残ります。</p>
          </div>
        ) : (
          <div className="explore-grid tight archive-grid">
            {items.map((it, i) => (
              <button key={it.id} className="explore-cell archive-cell" onClick={() => setOpenAt(i)}>
                <img src={it.imageUrl} alt={it.caption} />
                {it.expired && <span className="archive-expired">期限切れ</span>}
                {it.caption && <span className="archive-cap">{it.caption}</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {openAt !== null && group && (
        <StoryViewer
          groups={[group]}
          startIndex={0}
          startItemIndex={openAt}
          onClose={() => setOpenAt(null)}
        />
      )}
    </div>
  );
}
