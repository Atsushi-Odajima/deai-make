import { useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBlock, useConversation, useMessages, useSendMessage } from '../api/hooks';
import type { ChatMessage } from '../api/types';
import { Avatar } from '../components/Avatar';
import { ReportSheet } from '../components/ReportSheet';
import { Sheet } from '../components/Sheet';
import { useToast } from '../components/Toast';
import { IconChevronLeft, IconMore, IconSend } from '../components/icons';
import { getSocket } from '../lib/socket';
import { clockTime } from '../lib/time';
import { useAuth } from '../store/auth';

export function Chat() {
  const { conversationId = '' } = useParams();
  const navigate = useNavigate();
  const meId = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  const show = useToast((s) => s.show);

  const { data: convData } = useConversation(conversationId);
  const { data: messagesData, isLoading } = useMessages(conversationId);
  const send = useSendMessage(conversationId);
  const block = useBlock();

  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [theyTyping, setTheyTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<number>();

  const other = convData?.conversation.user;
  const messages = messagesData?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, theyTyping]);

  useEffect(() => {
    const socket = getSocket();
    const onTyping = (p: { conversationId: string }) => {
      if (p.conversationId !== conversationId) return;
      setTheyTyping(true);
      window.clearTimeout(typingTimeout.current);
      typingTimeout.current = window.setTimeout(() => setTheyTyping(false), 2500);
    };
    const onRead = (p: { conversationId: string; readAt: string }) => {
      if (p.conversationId !== conversationId) return;
      qc.setQueryData<{ messages: ChatMessage[] }>(['messages', conversationId], (prev) =>
        prev
          ? {
              messages: prev.messages.map((m) =>
                m.senderId === meId && !m.readAt ? { ...m, readAt: p.readAt } : m,
              ),
            }
          : prev,
      );
    };
    socket.on('typing', onTyping);
    socket.on('read', onRead);
    return () => {
      socket.off('typing', onTyping);
      socket.off('read', onRead);
    };
  }, [conversationId, meId, qc]);

  function onInput(value: string) {
    setText(value);
    if (other) getSocket().emit('typing', { conversationId, to: other.id });
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setText('');
    send.mutate(body);
  }

  function doBlock() {
    if (!other) return;
    block.mutate(other.id, {
      onSuccess: () => {
        show(`${other.displayName}さんをブロックしました`);
        navigate('/app/dm', { replace: true });
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
          onClick={() => other && navigate(`/app/u/${other.username}`)}
          disabled={!other}
        >
          <Avatar src={other?.avatar} name={other?.displayName ?? ''} size={38} />
          <div className="chat-peer-text">
            <span className="chat-peer-name">{other?.displayName ?? '…'}</span>
            <span className="chat-peer-status">{theyTyping ? '入力中…' : `@${other?.username ?? ''}`}</span>
          </div>
        </button>
        <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="メニュー">
          <IconMore width={22} height={22} />
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
                <Avatar src={other.avatar} name={other.displayName} size={84} ring />
                <h3>{other.displayName}</h3>
                <p className="muted">@{other.username}</p>
                <button className="btn btn-subtle" onClick={() => navigate(`/app/u/${other.username}`)}>
                  プロフィールを見る
                </button>
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
            other && navigate(`/app/u/${other.username}`);
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
