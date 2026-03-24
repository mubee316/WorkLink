import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, MapPin, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { Button } from '../design';
import { useAuth } from '../contexts/useAuth';
import { useSocket } from '../contexts/SocketContext';
import api from '../lib/api';

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const socket = useSocket();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [bookingAgreed, setBookingAgreed] = useState(null); // { hours, totalPrice, date, workerId }
  const bottomRef = useRef(null);

  const isWorker = userProfile?.role === 'worker';
  const currentUid = userProfile?.uid;

  // Load conversation + message history
  useEffect(() => {
    async function load() {
      try {
        const [convRes, msgRes] = await Promise.all([
          api.get(`/conversations/${conversationId}`),
          api.get(`/conversations/${conversationId}/messages`),
        ]);
        const conv = convRes.data.conversation;
        setConversation(conv);
        setMessages(msgRes.data.messages);
        if (conv.bookingAgreed) {
          setBookingAgreed({
            hours: conv.agreedHours,
            totalPrice: conv.agreedTotalPrice,
            date: conv.agreedDate,
            workerId: conv.workerId,
          });
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load conversation.');
      } finally {
        setLoadingConv(false);
      }
    }
    load();
    // Mark as read whenever the chat is opened
    api.patch(`/conversations/${conversationId}/read`).catch(() => {});
  }, [conversationId]);

  // Join socket room + listen for messages
  useEffect(() => {
    if (!socket) return;
    socket.emit('join_conversation', { conversationId });
    socket.on('new_conversation_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    socket.on('booking_agreed', (data) => {
      setBookingAgreed(data);
    });
    return () => {
      socket.off('new_conversation_message');
      socket.off('booking_agreed');
    };
  }, [socket, conversationId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const content = input.trim();
    if (!content || !socket) return;

    const optimistic = {
      id: `opt-${Date.now()}`,
      conversationId,
      senderId: currentUid,
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    socket.emit('send_conversation_message', { conversationId, content });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const otherName = conversation
    ? isWorker ? conversation.customerName : conversation.workerName
    : '';

  return (
    <AppLayout>
      {/* AI managed banner */}
      {conversation?.aiManaged && (
        <div className="flex items-center gap-2 border-b border-[var(--color-brand-200)] bg-[var(--color-brand-50)] px-4 py-2.5">
          <Sparkles className="h-3.5 w-3.5 flex-shrink-0 text-[var(--color-brand-700)]" />
          <p className="text-[12px] font-medium text-[var(--color-brand-700)]">
            {isWorker
              ? `WorkLink AI is handling this booking on behalf of ${conversation.customerName}`
              : 'WorkLink AI is negotiating this booking for you'}
          </p>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-3 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/conversations')}
            className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-muted)] transition hover:text-[var(--color-text-strong)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Messages
          </button>

          {conversation && (
            <>
              <div className="h-4 w-px bg-[var(--color-border-subtle)]" />

              {/* Other party info */}
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-xs font-bold text-white">
                  {getInitials(otherName)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-text-strong)]">{otherName}</p>
                  {!isWorker && (
                    <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-muted)]">
                      {conversation.workerArea && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{conversation.workerArea}
                        </span>
                      )}
                      {conversation.workerHourlyRate > 0 && (
                        <span className="font-semibold text-[var(--color-brand-700)]">
                          ₦{conversation.workerHourlyRate?.toLocaleString()}/hr
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Book Now — only customers can book */}
              {!isWorker && (
                <Button
                  size="sm"
                  onClick={() => navigate(`/book/${conversation.workerId}`)}
                >
                  Book Now
                </Button>
              )}
            </>
          )}
        </div>

        {/* Worker skills */}
        {conversation && !isWorker && conversation.workerSkills?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 pl-[52px]">
            {conversation.workerSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-brand-50)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-brand-700)]"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-5 space-y-3">
        {loadingConv ? (
          <div className="flex h-full items-center justify-center">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border-strong)] border-t-[var(--color-brand-500)]" />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center text-center px-6">
            <p className="font-semibold text-[var(--color-text-strong)]">Something went wrong</p>
            <p className="mt-1 text-sm text-[var(--color-error)]">{error}</p>
            <button
              onClick={() => navigate('/conversations')}
              className="mt-4 text-[13px] font-semibold text-[var(--color-brand-700)] hover:underline"
            >
              Back to Messages
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-brand-100)]">
              <Star className="h-6 w-6 text-[var(--color-brand-700)]" />
            </div>
            <p className="font-semibold text-[var(--color-text-strong)]">Start the conversation</p>
            <p className="mt-1 max-w-xs text-[13px] text-[var(--color-text-muted)]">
              {isWorker
                ? 'Respond to the customer to discuss the job details.'
                : 'Describe what you need, agree on hours, then book.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAi = msg.senderId === 'ai';
            const isMine = !isAi && msg.senderId === currentUid;
            const isBookingCard = msg.isBookingCard;

            if (isBookingCard) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="w-full max-w-sm rounded-2xl border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-600)]" />
                      <span className="text-[13px] font-bold text-[var(--color-brand-700)]">Booking Agreed</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-[var(--color-text-body)]">{msg.content}</p>
                    {!isWorker && bookingAgreed && (
                      <button
                        onClick={() => navigate(`/book/${bookingAgreed.workerId}`)}
                        className="mt-3 w-full rounded-xl bg-[var(--color-brand-600)] py-2.5 text-[13px] font-bold text-white transition hover:bg-[var(--color-brand-700)]"
                      >
                        Confirm & Pay
                      </button>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col gap-0.5 ${isAi ? 'items-start' : isMine ? 'items-end' : 'items-start'}`}>
                {isAi && (
                  <div className="mb-0.5 flex items-center gap-1.5 pl-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-brand-600)]">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold text-[var(--color-brand-700)]">WorkLink AI</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 text-[14px] leading-snug
                    ${isMine
                      ? 'rounded-br-sm bg-[var(--color-brand-500)] text-white'
                      : isAi
                        ? 'rounded-bl-sm border border-[var(--color-brand-200)] bg-[var(--color-brand-50)] text-[var(--color-brand-800)]'
                        : 'rounded-bl-sm border border-[var(--color-border-subtle)] bg-white text-[var(--color-text-strong)]'
                    }`}
                >
                  {msg.content}
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })
                    : ''}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-[var(--color-border-subtle)] bg-white px-4 py-3 space-y-2">
        {!socket && (
          <p className="text-center text-[11px] text-[var(--color-text-muted)]">
            Connecting…
          </p>
        )}
        {conversation?.aiManaged && !isWorker ? (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--color-surface-canvas)] py-3">
            <Sparkles className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
            <p className="text-[12px] text-[var(--color-text-muted)]">
              WorkLink AI is handling the conversation
            </p>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              className="flex-1 rounded-[10px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-canvas)] px-4 py-2.5 text-[14px] text-[var(--color-text-strong)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-border-focus)] focus:outline-none focus:ring-4 focus:ring-[rgba(55,166,83,0.12)]"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || !socket}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-500)] text-white transition hover:bg-[var(--color-brand-600)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
