import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useDiscovery, useSwipe } from '../api/hooks';
import type { Candidate, MatchSummary, PublicUser, SwipeAction } from '../api/types';
import { MatchModal } from '../components/MatchModal';
import { SwipeCard } from '../components/SwipeCard';
import { useToast } from '../components/Toast';
import { IconBolt, IconHeart, IconRewind, IconStar, IconX } from '../components/icons';
import { useAuth } from '../store/auth';

export function Discover() {
  const me = useAuth((s) => s.user);
  const { data, isLoading, refetch, isFetching } = useDiscovery();
  const swipe = useSwipe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const show = useToast((s) => s.show);

  const [deck, setDeck] = useState<Candidate[]>([]);
  const [command, setCommand] = useState<SwipeAction | null>(null);
  const [match, setMatch] = useState<MatchSummary | null>(null);
  const lastSwipe = useRef<{ candidate: Candidate } | null>(null);
  const seeded = useRef(false);

  // Seed the deck once from the first fetch; afterwards the deck is the source
  // of truth so swiped cards don't reappear on background refetches.
  useEffect(() => {
    if (!seeded.current && data?.candidates) {
      setDeck(data.candidates);
      seeded.current = true;
    }
  }, [data]);

  const top = deck[0];
  const next = deck[1];

  function decide(action: SwipeAction, candidate: Candidate) {
    setCommand(null);
    lastSwipe.current = { candidate };
    setDeck((d) => d.filter((c) => c.id !== candidate.id));
    swipe.mutate(
      { targetId: candidate.id, action },
      {
        onSuccess: (res) => {
          if (res.matched && res.match) {
            setMatch(res.match);
            qc.invalidateQueries({ queryKey: ['matches'] });
          }
        },
      },
    );
  }

  function button(action: SwipeAction) {
    if (!top || command) return;
    setCommand(action);
  }

  async function rewind() {
    try {
      const res = await api.post<{ targetId: string }>('/swipes/rewind');
      const { user } = await api.get<{ user: PublicUser }>(`/users/${res.targetId}`);
      const restored: Candidate = {
        ...user,
        sharedInterests: 0,
        likedYou: false,
        superLikedYou: false,
      };
      setDeck((d) => [restored, ...d]);
      show('1つ前に戻しました');
    } catch {
      show('戻せるスワイプがありません');
    }
  }

  async function reload() {
    seeded.current = false;
    const res = await refetch();
    if (res.data) {
      setDeck(res.data.candidates);
      seeded.current = true;
    }
  }

  return (
    <div className="discover">
      <header className="topbar">
        <span className="wordmark">Mingle</span>
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => navigate('/app/settings')} aria-label="設定">
            <IconStar width={20} height={20} />
          </button>
        </div>
      </header>

      <div className="deck-area">
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : deck.length === 0 ? (
          <div className="center-col deck-empty">
            <div className="deck-empty-emoji">🌊</div>
            <h3>今日はここまで！</h3>
            <p className="muted">
              新しい人が見つかると、ここに表示されます。少し時間をおいて戻ってきてね。
            </p>
            <button className="btn btn-subtle" onClick={reload} disabled={isFetching}>
              {isFetching ? '更新中…' : 'もう一度さがす'}
            </button>
          </div>
        ) : (
          <div className="deck">
            {next && (
              <SwipeCard
                key={next.id}
                candidate={next}
                isTop={false}
                command={null}
                onDecided={() => {}}
              />
            )}
            {top && (
              <SwipeCard
                key={top.id}
                candidate={top}
                isTop
                command={command}
                onDecided={decide}
                onOpenProfile={(c) => navigate(`/app/u/${c.id}`)}
              />
            )}
          </div>
        )}
      </div>

      {deck.length > 0 && (
        <div className="action-bar">
          <button className="action-btn rewind" onClick={rewind} aria-label="戻す">
            <IconRewind width={20} height={20} />
          </button>
          <button className="action-btn nope" onClick={() => button('pass')} aria-label="パス">
            <IconX width={28} height={28} />
          </button>
          <button
            className="action-btn super"
            onClick={() => button('superlike')}
            aria-label="スーパーいいね"
          >
            <IconBolt width={24} height={24} />
          </button>
          <button className="action-btn like" onClick={() => button('like')} aria-label="いいね">
            <IconHeart width={28} height={28} />
          </button>
        </div>
      )}

      <MatchModal match={match} me={me} onClose={() => setMatch(null)} />
    </div>
  );
}
