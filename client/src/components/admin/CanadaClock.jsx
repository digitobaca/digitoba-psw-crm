import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Eastern Time — Ontario, where the PSW pathway and most partner colleges
// this CRM deals with actually operate. Staff here are largely India-based,
// so a plain local-time readout wouldn't mean much without the label.
const TIMEZONE = 'America/Toronto';

/** Live clock in the header showing current time in Canada — ticks every second, DST-aware (EST/EDT resolves automatically). */
export default function CanadaClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const time = now.toLocaleTimeString('en-US', {
    timeZone: TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  const tzName =
    new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE, timeZoneName: 'short' })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value || 'ET';

  return (
    <div
      className={cn(
        'hidden lg:inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-transparent',
        'bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground'
      )}
      title="Current time in Ontario, Canada"
    >
      <span aria-hidden="true">🍁</span>
      <span className="font-semibold tabular-nums">{time}</span>
      <span className="text-muted-foreground">{tzName}</span>
    </div>
  );
}
