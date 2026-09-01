import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge.jsx';
import StudentMessagesTab from '@/components/admin/StudentMessagesTab.jsx';
import { formatDate, formatTime, cn } from '@/lib/utils';
import * as api from '@/lib/api';

const INBOX_POLL_MS = 8000;

/**
 * Top-level Messages inbox — one conversation per student, newest first,
 * with an unread count per row. Counsellors see only their own assigned
 * students; admins see every conversation (for monitoring), with the
 * assigned counsellor shown so it's clear who owns each thread. Opening a
 * conversation marks its unread messages as read (handled server-side the
 * moment the thread is fetched).
 */
export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = (silent) => {
    if (!silent) setLoading(true);
    api
      .fetchInbox()
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), INBOX_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleSelect = (conversation) => {
    setSelected(conversation);
    // Optimistically clear the unread badge for this row — the server marks
    // the underlying messages read as soon as StudentMessagesTab fetches them.
    setConversations((prev) =>
      prev.map((c) => (c.student._id === conversation.student._id ? { ...c, unreadCount: 0 } : c))
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {user?.role === 'admin' ? 'Every student conversation, across all counsellors.' : 'Your conversations with your assigned students.'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Badge className="bg-indigo-100 text-indigo-800 border-transparent">Monitoring — view only</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="max-h-[32rem] overflow-y-auto divide-y">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No conversations yet.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.student._id}
                  onClick={() => handleSelect(c)}
                  className={cn(
                    'w-full text-left p-3 hover:bg-secondary/50 transition-colors',
                    selected?.student._id === c.student._id && 'bg-secondary'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900 truncate">{c.student.name}</p>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {c.lastDirection === 'Outbound' ? 'You: ' : ''}
                    {c.lastMessage}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {user?.role === 'admin' && c.student.assignedCounsellor?.name && <>{c.student.assignedCounsellor.name} &middot; </>}
                    {formatDate(c.lastAt)} {formatTime(c.lastAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          {selected ? (
            <StudentMessagesTab student={selected.student} />
          ) : (
            <p className="text-sm text-muted-foreground m-auto text-center py-16">Select a conversation to view it.</p>
          )}
        </div>
      </div>
    </div>
  );
}
