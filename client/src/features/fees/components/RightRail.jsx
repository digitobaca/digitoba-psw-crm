import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { ToneBadge } from '@/features/fees/components/StatusPill.jsx';
import * as feesApi from '@/features/fees/api';

const POLL_MS = 15000;

function deepLinkPath(deepLink) {
  if (!deepLink) return null;
  if (deepLink.kind === 'student') return `/fees/students/${deepLink.id}`;
  if (deepLink.kind === 'batch') return '/fees/remittances';
  return null;
}

/** Action queue (GET /alerts) — coloured dot, title, meta, and a deep-linking action button. */
function ActionQueue() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poll = () =>
      feesApi
        .fetchFeeAlerts()
        .then((res) => setAlerts(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const dotColor = { bad: 'bg-red-500', warn: 'bg-amber-500', info: 'bg-blue-500', ok: 'bg-emerald-500' };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Action queue</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing needs attention right now.</p>
        ) : (
          alerts.slice(0, 12).map((a, i) => {
            const path = deepLinkPath(a.deepLink);
            return (
              <div key={i} className="flex items-start gap-2.5">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dotColor[a.tone] || 'bg-gray-400'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.meta}</p>
                </div>
                {path && (
                  <Button asChild size="sm" variant="outline" className="shrink-0 h-7 px-2 text-xs">
                    <Link to={path}>{a.actionLabel}</Link>
                  </Button>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

/** Shared ledger feed (GET /feed) — tag chip, time, text. */
function LedgerFeed() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const poll = () =>
      feesApi
        .fetchFeeFeed(40)
        .then((res) => setEvents(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shared ledger feed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[420px] overflow-y-auto">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          events.map((e) => (
            <div key={e._id} className="text-sm border-b last:border-b-0 pb-2 last:pb-0">
              <div className="flex items-center gap-2 mb-0.5">
                <ToneBadge tone={e.tone} className="text-[10px] px-1.5 py-0">
                  {e.tag}
                </ToneBadge>
                <span className="text-[11px] text-muted-foreground">{new Date(e.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
              <p className="text-gray-700">{e.text}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

/** Right rail shown on every fee page: action queue + shared ledger feed. */
export default function RightRail() {
  return (
    <div className="space-y-6">
      <ActionQueue />
      <LedgerFeed />
    </div>
  );
}
