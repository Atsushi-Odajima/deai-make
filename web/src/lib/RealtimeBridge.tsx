import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { ChatMessage } from '../api/types';
import { useToast } from '../components/Toast';
import { getSocket } from './socket';

/**
 * App-wide realtime listener (mounted once while authenticated). Keeps caches
 * fresh and surfaces light notifications. The Chat screen handles typing/read.
 */
export function RealtimeBridge() {
  const qc = useQueryClient();
  const show = useToast((s) => s.show);
  const location = useLocation();

  useEffect(() => {
    const socket = getSocket();

    const onMessage = ({ message }: { message: ChatMessage }) => {
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', message.conversationId], (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { messages: [...prev.messages, message] };
      });
      qc.invalidateQueries({ queryKey: ['conversations'] });
      // Only toast if the user isn't already looking at that thread.
      if (!location.pathname.includes(message.conversationId)) {
        show('新しいメッセージが届きました 💬');
      }
    };
    const onFollow = () => qc.invalidateQueries({ queryKey: ['profile'] });
    const onNotification = () => {
      qc.invalidateQueries({ queryKey: ['notifications-unread'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('message', onMessage);
    socket.on('follow', onFollow);
    socket.on('notification', onNotification);
    return () => {
      socket.off('message', onMessage);
      socket.off('follow', onFollow);
      socket.off('notification', onNotification);
    };
  }, [qc, show, location.pathname]);

  return null;
}
