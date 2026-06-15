import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import type { ChatMessage, MatchSummary } from '../api/types';
import { useToast } from '../components/Toast';
import { getSocket } from './socket';

/**
 * App-wide realtime listener. Mounted once while authenticated; keeps query
 * caches fresh and surfaces new-match / new-message toasts. Per-conversation
 * concerns (typing, read receipts) are handled inside the Chat screen.
 */
export function RealtimeBridge() {
  const qc = useQueryClient();
  const show = useToast((s) => s.show);

  useEffect(() => {
    const socket = getSocket();

    const onMatch = ({ match }: { match: MatchSummary }) => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['likes'] });
      show(`${match.user.displayName} とマッチしました！`);
    };

    const onMessage = ({ message }: { message: ChatMessage }) => {
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', message.matchId], (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { messages: [...prev.messages, message] };
      });
      qc.invalidateQueries({ queryKey: ['matches'] });
    };

    socket.on('match', onMatch);
    socket.on('message', onMessage);
    return () => {
      socket.off('match', onMatch);
      socket.off('message', onMessage);
    };
  }, [qc, show]);

  return null;
}
