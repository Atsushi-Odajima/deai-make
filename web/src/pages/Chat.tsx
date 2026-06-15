import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useBlock, useMatch, useMessages, useSendMessage } from '../api/hooks';
import type { ChatMessage } from '../api/types';
import { Avatar } from '../components/Avatar';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { IconChevronLeft, IconSend } from '../components/icons';
import { getSocket } from '../lib/socket';
import { clockTime } from '../lib/time';
import { useAuth } from '../store/auth';

export function Chat() {
  const { matchId = '' } = useParams();
  const navigate = useNavigate();
  const meId = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  const show = useToast((s) => s.show);

  const { data: matchData } = useMatch(matchId);
  const { data: messagesData, isLoading } = useMessages(matchId);
  const send = useSendMessage(matchId);
  const block = useBlock();

  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [theyTyping, setTheyTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number>();

  const other = matchData?.match.user;
  const messages = messagesData?.messages ?? [];

  // Scroll to newest whenever the message list or typing indicator changes.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, theyTyping]);

  // Per-conversation realtime: typing indicator + read receipts.
  useEffect(() => {
    const socket = getSocket();
    const onTyping = (p: { matchId: string }) => {
      if (p.matchId !== matchId) return;
      setTheyTyping(true);
      window.clearTimeout(typingTimeout.current);
      typingTimeout.current = window.setTimeout(() => setTheyTyping(false), 2500);
    };
    const onRead = (p: { matchId: string; readAt: string }) => {
      if (p.matchId !== matchId) return;
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', matchId], (prev) =>
        prev
          ? {
              messages: prev.messages.map((m) =>
                m.senderId === meId && !m.readAt ? { ...m, readAt: p.readAt } : m,
              ),
            }
          : prev,
      );
    };
    const onMessage = () => qc.invalidateQueries({ queryKey: ['matches'] });
    socket.on('typing', onTyping);
    socket.on('read', onRead);
    socket.on('message', onMessage);
    return () => {
      socket.off('typing', onTyping);
      socket.off('read', onRead);
      socket.off('message', onMessage);
    };
  }, [matchId, meId, qc]);

  function onInput(value: string) {
    setText(value);
    if (other) getSocket().emit('typing', { matchId, to: other.id });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body);
  }

  async function unmatch() {
    await api.delete(`/matches/${matchId}`);
    qc.invalidateQueries({ queryKey: ['matches'] });
    show('マッチを解除しました');
    navigate('/app/matches', { replace: true });
  }

  function doBlock() {
    if (!other) return;
    block.mutate(other.id, {
      onSuccess: () => {
        show(`${other.displayName}さんをブロックしました`);
        navigate('/app/matches', { replace: true });
      },
    });
  }

  const lastMine = [...messages].reverse().find((m) => m.senderId === meId);

  return (
    <div className="screen chat-screen">
      <header className="chat-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <IconChevronLeft />
        </button>
        <button
          className="chat-peer"
          onClick={() => other && navigate(`/app/u/${other.id}`)}
          disabled={!other}
        >
          <Avatar src={other?.photos[0]} name={other?.displayName ?? ''} size={38} />
          <div className="chat-peer-text">
            <span className="chat-peer-name">{other?.displayName ?? '…'}</span>
            <span className="chat-peer-status">{theyTyping ? '入力中…' : 'マッチ済み'}</span>
          </div>
        </button>
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="メニュー">
          <span style={{ fontSize: 22, lineHeight: 1, fontWeight: 700 }}>⋯</span>
        </button>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        {isLoading ? (
          <div className="center-col">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {other && (
              <div className="chat-intro">
                <Avatar src={other.photos[0]} name={other.displayName} size={84} ring />
                <h3>{other.displayName}さんとマッチしました 🎉</h3>
                {other.interests.length > 0 && (
                  <p className="muted">共通点を見つけて話しかけてみよう</p>
                )}
              </div>
            )}
            {messages.map((m, i) => {
              const mine = m.senderId === meId;
              const showTime =
                i === messages.length - 1 ||
                messages[i + 1].senderId !== m.senderId ||
                new Date(messages[i + 1].createdAt).getTime() - new Date(m.createdAt).getTime() >
                  5 * 60000;
              return (
                <div key={m.id} className={`bubble-row ${mine ? 'mine' : 'theirs'}`}>
                  <div className="bubble">{m.body}</div>
                  {showTime && (
                    <span className="bubble-time">
                      {clockTime(m.createdAt)}
                      {mine && m.id === lastMine?.id && m.readAt && ' · 既読'}
                    </span>
                  )}
                </div>
              );
            })}
            {theyTyping && (
              <div className="bubble-row theirs">
                <div className="bubble typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <form className="chat-input-bar" onSubmit={submit}>
        <input
          className="chat-input"
          value={text}
          onChange={(e) => onInput(e.target.value)}
          placeholder="メッセージを入力"
          maxLength={2000}
        />
        <button className="chat-send" disabled={!text.trim()} aria-label="送信">
          <IconSend width={20} height={20} />
        </button>
      </form>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} title={other?.displayName}>
        <button
          className="sheet-action"
          onClick={() => {
            setMenuOpen(false);
            other && navigate(`/app/u/${other.id}`);
          }}
        >
          プロフィールを見る
        </button>
        <button
          className="sheet-action"
          onClick={() => {
            setMenuOpen(false);
            setReportOpen(true);
          }}
        >
          通報する
        </button>
        <button
          className="sheet-action danger"
          onClick={() => {
            setMenuOpen(false);
            doBlock();
          }}
        >
          ブロックする
        </button>
        <button
          className="sheet-action danger"
          onClick={() => {
            setMenuOpen(false);
            unmatch();
          }}
        >
          マッチを解除する
        </button>
      </Sheet>

      {other && (
        <ReportSheet
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          userId={other.id}
          userName={other.displayName}
        />
      )}
    </div>
  );
}
