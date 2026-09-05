import { Card, CardContent } from '@/components/ui/card.jsx';
import { formatMoney } from '@/features/fees/format';
import PlanSegmentBar, { StatusLegend } from '@/features/fees/components/PlanSegmentBar.jsx';

function Tile({ label, value, sub }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/** "Where the fees are right now" tiles + one stacked bar — role-aware per BUILD PROMPT section 6. */
export default function SummaryTiles({ summary, role }) {
  if (!summary) return null;
  const { totals, bar } = summary;
  const clearedPct = totals.totalCents > 0 ? Math.round((totals.clearedCents / totals.totalCents) * 100) : 0;

  // Fabricate a pseudo "instalments" list for the stacked bar component from aggregate bucket totals.
  const barSegments = [
    { label: 'Cleared', amountCents: bar.clearedCents, effectiveStatus: 'cleared', channel: 'agent' },
    { label: 'Held by agent', amountCents: bar.heldCents, effectiveStatus: 'agent', channel: 'agent' },
    { label: 'Claimed from BJO', amountCents: bar.bjoCents, effectiveStatus: 'funder', channel: 'funder' },
    { label: 'Overdue', amountCents: bar.overdueCents, effectiveStatus: 'overdue', channel: 'agent' },
    { label: 'Not yet due', amountCents: bar.notYetDueCents, effectiveStatus: 'due', channel: 'agent' },
  ].filter((s) => s.amountCents > 0);

  return (
    <div className="space-y-4">
      {role === 'partner' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Tile label="My students" value={summary.studentCount} sub={summary.partner ? `${summary.partner.tier} · ${summary.partner.commissionRatePct}%` : ''} />
          <Tile label="Confirmed by college" value={formatMoney(totals.clearedCents)} />
          <Tile
            label="I hold, not yet remitted"
            value={formatMoney(totals.heldCents)}
            sub={summary.commission ? `Remit within ${summary.commission.late ? 'the window (overdue)' : 'a few days'}` : ''}
          />
          <Tile label="Commission accrued" value={formatMoney(summary.commission?.accruedCents)} />
          <Tile label="Overdue from students" value={formatMoney(totals.overdueCents)} />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Tile label="Invoiced (all students)" value={formatMoney(totals.totalCents)} />
          <Tile label="In college bank account" value={formatMoney(totals.clearedCents)} sub={`${clearedPct}% of invoiced`} />
          <Tile label="Collected, not remitted" value={formatMoney(totals.heldCents)} />
          <Tile label="Claimed from BJO" value={formatMoney(totals.funderCents)} />
          <Tile label="Outstanding from students" value={formatMoney(totals.outstandingCents)} sub={`${formatMoney(totals.overdueCents)} overdue`} />
        </div>
      )}

      {barSegments.length > 0 && (
        <div className="space-y-2">
          <PlanSegmentBar instalments={barSegments} height={14} />
          <StatusLegend />
        </div>
      )}
    </div>
  );
}
