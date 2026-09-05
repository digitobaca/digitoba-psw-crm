import { STATUS_COLORS, STATUS_LABELS, CHANNEL_LABELS } from '@/features/fees/constants';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import { cn } from '@/lib/utils';

/**
 * One mini segment per instalment, coloured by effective status, sized
 * proportionally to its amount. A direct-paid instalment gets an outlined
 * segment (BUILD PROMPT: "Instalments paid direct get an outlined segment").
 * Tooltip via the native `title` attribute (no tooltip primitive in the UI
 * library yet) shows label / amount / due / status / route.
 */
export default function PlanSegmentBar({ instalments, className, height = 10 }) {
  const total = instalments.reduce((sum, i) => sum + i.amountCents, 0) || 1;
  return (
    <div className={cn('flex w-full overflow-hidden rounded-full bg-secondary', className)} style={{ height }}>
      {instalments.map((inst, i) => {
        const status = inst.effectiveStatus || inst.status;
        const width = (inst.amountCents / total) * 100;
        const isDirect = inst.channel === 'direct' && status === 'cleared';
        const title = `${inst.label} · ${formatMoney(inst.amountCents)} · due ${formatFeeDate(inst.dueDate)} · ${STATUS_LABELS[status] || status} · ${CHANNEL_LABELS[inst.channel] || inst.channel}`;
        return (
          <div
            key={i}
            title={title}
            style={{
              width: `${width}%`,
              backgroundColor: isDirect ? '#fff' : STATUS_COLORS[status] || '#ccc',
              border: isDirect ? `2px solid ${STATUS_COLORS[status] || '#ccc'}` : 'none',
              boxSizing: 'border-box',
            }}
          />
        );
      })}
    </div>
  );
}

/** Legend row for the plan segment bar / summary stacked bar. */
export function StatusLegend({ statuses = Object.keys(STATUS_COLORS), className }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground', className)}>
      {statuses.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[s] }} />
          {STATUS_LABELS[s]}
        </span>
      ))}
    </div>
  );
}
