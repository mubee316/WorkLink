import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import AppLayout from '../components/layout/AppLayout';
import { useAuth } from '../contexts/useAuth';
import api from '../lib/api';


function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export default function ConversationsPage() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const isWorker = userProfile?.role === 'worker';

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/conversations/my')
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppLayout>
      <header className="border-b border-[var(--color-border-subtle)] bg-white px-4 sm:px-8 py-5">
        <h1 className="text-[1.05rem] font-bold text-[var(--color-text-strong)]">Messages</h1>
        <p className="text-[13px] text-[var(--color-text-muted)]">
          {isWorker ? 'Chats from customers' : 'Your conversations with workers'}
        </p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 sm:py-6">
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-[var(--color-border-subtle)] bg-white" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageSquare className="mb-3 h-10 w-10 text-[var(--color-border-strong)]" />
            <p className="font-semibold text-[var(--color-text-strong)]">No conversations yet</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {isWorker
                ? 'Customers will message you before booking.'
                : 'Find a worker and start a conversation.'}
            </p>
            {!isWorker && (
              <button
                onClick={() => navigate('/workers')}
                className="mt-5 rounded-xl bg-[var(--color-brand-500)] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[var(--color-brand-600)]"
              >
                Find Workers
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => {
              const otherName = isWorker ? conv.customerName : conv.workerName;
              const unread = conv.unreadCount?.[userProfile?.uid] || 0;
              return (
                <div
                  key={conv.id}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-white px-5 py-4 transition hover:border-[var(--color-border-focus)]
                    ${unread > 0 ? 'border-[var(--color-brand-500)] bg-[var(--color-brand-50)]' : 'border-[var(--color-border-subtle)]'}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-brand-700)] text-sm font-bold text-white">
                      {getInitials(otherName)}
                    </div>
                    {unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-500)] px-1 text-[10px] font-bold text-white">
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate font-semibold ${unread > 0 ? 'text-[var(--color-text-strong)]' : 'text-[var(--color-text-strong)]'}`}>
                        {otherName}
                      </p>
                      <span className="flex-shrink-0 text-[11px] text-[var(--color-text-muted)]">
                        {timeAgo(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className={`mt-0.5 truncate text-[13px] ${unread > 0 ? 'font-semibold text-[var(--color-text-body)]' : 'text-[var(--color-text-muted)]'}`}>
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </AppLayout>
  );
}
