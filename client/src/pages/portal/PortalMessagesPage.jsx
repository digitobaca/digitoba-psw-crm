import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Send } from '@/components/animate-ui/icons';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import * as api from '@/lib/api';

const POLL_MS = 5000;

export default function PortalMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const load = (silent) => {
    if (!silent) setLoading(true);
    api
      .fetchPortalMessages()
      .then((res) => setMessages(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), POLL_MS);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await api.sendPortalMessage(text.trim());
      setText('');
      load();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-sm text-muted-foreground">Your conversation with your counsellor.</p>
      </div>

      <div className="rounded-xl border bg-white p-4 h-96 overflow-y-auto flex flex-col gap-3">
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
                m.direction === 'Inbound' ? 'self-end bg-primary text-primary-foreground' : 'self-start bg-secondary text-gray-800'
              )}
            >
              <p>{m.message}</p>
              <p className={cn('mt-1 text-[10px]', m.direction === 'Inbound' ? 'text-red-100' : 'text-muted-foreground')}>
                {m.direction === 'Inbound' ? 'You' : m.counsellor?.name || 'Counsellor'} &middot; {formatDate(m.createdAt)}
              </p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." className="flex-1" />
        <Button type="submit" disabled={sending || !text.trim()} className="self-end gap-1.5">
          Send <Send size={16} />
        </Button>
      </form>
    </div>
  );
}
