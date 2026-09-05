import { STATUS_COLORS, STATUS_LABELS, TONE_BADGE_VARIANT } from '@/features/fees/constants';
import { Badge } from '@/components/ui/badge.jsx';
import { cn } from '@/lib/utils';

/** A status pill using the exact colours specified for the Fee Ledger (badge.jsx's variant set doesn't cover all of them). */
export default function StatusPill({ status, className }) {
  const color = STATUS_COLORS[status] || '#999';
  const label = STATUS_LABELS[status] || status;
  // Overdue/held/transit use white text for contrast against their darker fills; "not yet due" (light grey) reads better dark-on-light.
  const textColor = status === 'due' ? '#4A4438' : '#fff';
  return (
    <span
      className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', className)}
      style={{ backgroundColor: color, color: textColor }}
    >
      {label}
    </span>
  );
}

/** Tag chip for ledger feed/history events — 'bad' tone isn't in badge.jsx's variant set, so it gets a manual red pill. */
export function ToneBadge({ tone, children, className }) {
  if (tone === 'bad') {
    return (
      <span className={cn('inline-flex items-center rounded-full border border-transparent bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800', className)}>
        {children}
      </span>
    );
  }
  return (
    <Badge variant={TONE_BADGE_VARIANT[tone] || 'secondary'} className={className}>
      {children}
    </Badge>
  );
}
