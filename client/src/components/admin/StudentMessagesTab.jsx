import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Send } from '@/components/animate-ui/icons';
import { useToast } from '@/components/ui/toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, cn } from '@/lib/utils';
import * as api from '@/lib/api';

const POLL_MS = 5000;

/**
 * Real two-way chat between a counsellor and their assigned student. Shares
 * the same CommunicationLog collection as the student portal's Messages
 * page — a student's `direction: 'Inbound'` note here is exactly what they
 * sent from /portal/messages, and vice versa. Polls while open so replies
 * on either side show up without a manual refresh.
 *
 * Admins can open and read any conversation (for monitoring) but are not a
 * participant — the compose box is hidden for them, and the server rejects
 * an admin-sent chat message even if someone forces the request.
 */
export default function StudentMessagesTab({ student }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = (silent) => {
    if (!silent) setLoading(true);
    api
      .fetchCommunications(student._id, 'chat')
      .then((res) => setMessages([...res.data].reverse())) // API returns newest-first; chat reads oldest-first
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(interval);
  }, [student._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.createCommunication({ student: student._id, channel: 'Note', message: text.trim() });
      setText('');
      load();
    } catch (err) {
      toast({ title: 'Could not send message', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {isAdmin
            ? `Monitoring the conversation between ${student.assignedCounsellor?.name || 'their counsellor'} and ${student.name.split(' ')[0]}.`
            : `Direct chat with ${student.name.split(' ')[0]} — they see this in their student portal's Messages page.`}
        </p>
        {isAdmin && (
          <Badge variant="secondary" className="shrink-0">
            View only
          </Badge>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 h-72 overflow-y-auto flex flex-col gap-3">
        {loading ? (
          <p className="text-sm text-muted-foreground m-auto">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground m-auto">No messages yet — say hello!</p>
        ) : (
          messages.map((m) => (
            <div
              key={m._id}
              className={cn(
                'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                m.direction === 'Outbound' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-secondary text-gray-800'
              )}
            >
              <p className="whitespace-pre-wrap break-words">{m.message}</p>
              <p className={cn('mt-1 text-[10px]', m.direction === 'Outbound' ? 'text-red-100' : 'text-muted-foreground')}>
                {m.direction === 'Outbound' ? m.counsellor?.name || 'You' : student.name.split(' ')[0]} &middot; {formatDate(m.createdAt)}{' '}
                {formatTime(m.createdAt)}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {isAdmin ? (
        <p className="text-xs text-muted-foreground text-center py-1">
          Admins can view conversations but not send messages — only {student.assignedCounsellor?.name || 'the assigned counsellor'} can reply here.
        </p>
      ) : (
        <form onSubmit={handleSend} className="flex gap-2">
          <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1" />
          <Button type="submit" disabled={sending || !text.trim()} className="self-end gap-1.5">
            Send <Send size={16} />
          </Button>
        </form>
      )}
    </div>
  );
}
