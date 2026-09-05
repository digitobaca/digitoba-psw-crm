import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import StatusPill, { ToneBadge } from '@/features/fees/components/StatusPill.jsx';
import QuickActionModal from '@/features/fees/components/QuickActionModal.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import { FUNDING_LABELS, CHANNEL_LABELS } from '@/features/fees/constants';
import * as feesApi from '@/features/fees/api';

function BigNumber({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

function InstalmentCard({ inst, student, role, isPartnerOwner, onAction, busy }) {
  const status = inst.effectiveStatus;
  const mismatch = inst.reportedCents != null && Math.abs(inst.reportedCents - inst.amountCents) > 50 && status === 'agent';

  let actionBar = null;
  if (status === 'transit') {
    actionBar = isPartnerOwner ? (
      <Button size="sm" variant="outline" disabled>
        Awaiting college
      </Button>
    ) : (
      <Button asChild size="sm" variant="outline">
        <a href="/fees/remittances">Go to Remittances</a>
      </Button>
    );
  } else if ((status === 'agent' || status === 'funder') && ['admin', 'registrar'].includes(role)) {
    actionBar = (
      <Button size="sm" variant={mismatch ? 'destructive' : 'default'} disabled={busy} onClick={() => onAction('confirm', inst.index)}>
        Confirm receipt
      </Button>
    );
  } else if ((status === 'due' || status === 'overdue') && inst.channel === 'agent' && (isPartnerOwner || ['admin', 'registrar'].includes(role))) {
    actionBar = (
      <Button size="sm" disabled={busy} onClick={() => onAction('log-receipt', inst.index)}>
        Log receipt
      </Button>
    );
  } else if ((status === 'due' || status === 'overdue') && ['admin', 'registrar'].includes(role)) {
    actionBar =
      student.fundingType === 'bjo' ? (
        <Button size="sm" disabled={busy} onClick={() => onAction('submit-claim', inst.index)}>
          Submit BJO claim
        </Button>
      ) : (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => onAction('record-direct', inst.index)}>
          Record direct payment
        </Button>
      );
  }

  return (
    <Card className={mismatch ? 'border-red-300' : ''}>
      <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{inst.label}</p>
            <StatusPill status={status} />
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {formatMoney(inst.amountCents)} · due {formatFeeDate(inst.dueDate)} · {CHANNEL_LABELS[inst.channel]}
          </p>
          {inst.receiptRef && <p className="text-xs text-muted-foreground mt-0.5">{inst.receiptRef}</p>}
          {status === 'transit' && inst.batchRef && <p className="text-xs text-muted-foreground mt-0.5">Inside remittance batch {inst.batchRef}. Confirm the whole batch on the Remittances tab.</p>}
          {mismatch && (
            <p className="text-xs text-red-600 font-medium mt-1">
              Partner reported {formatMoney(inst.reportedCents)} vs invoiced {formatMoney(inst.amountCents)} — diff {formatMoney(Math.abs(inst.reportedCents - inst.amountCents))}.
            </p>
          )}
        </div>
        {actionBar && <div className="shrink-0">{actionBar}</div>}
      </CardContent>
    </Card>
  );
}

export default function StudentLedgerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [quickAction, setQuickAction] = useState(null); // { kind: 'log-receipt'|'record-direct', idx }

  const load = () => {
    setLoading(true);
    feesApi
      .fetchFeeStudent(id)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load this student.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleAction = async (kind, idx) => {
    setBusy(true);
    try {
      if (kind === 'confirm') await feesApi.confirmReceipt(id, idx);
      else if (kind === 'submit-claim') await feesApi.submitBjoClaim(id, idx);
      else if (kind === 'log-receipt' || kind === 'record-direct') {
        setQuickAction({ kind, idx });
        setBusy(false);
        return;
      }
      toast({ title: 'Updated' });
      load();
    } catch (err) {
      toast({ title: 'Could not update', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (error || !data) return <p className="py-10 text-center text-sm text-destructive">{error || 'Not found'}</p>;

  const isPartnerOwner = user?.role === 'partner' && String(data.partnerId?._id) === String(user.partnerId);
  const program = data.programId;
  const partner = data.partnerId;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="outline" size="sm" onClick={() => navigate('/fees/students')} className="mb-3">
          ← Back to students
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
          <span className="text-sm text-muted-foreground">{data.sid}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {program?.name} · {FUNDING_LABELS[data.fundingType]}
          {partner && (
            <>
              {' · '}
              {partner.name}
              {partner.phone && (
                <>
                  {' · '}
                  <a className="text-primary hover:underline" href={`tel:${partner.phone}`}>
                    {partner.phone}
                  </a>
                </>
              )}
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <BigNumber label="Fee plan total" value={formatMoney(data.sums.totalCents)} />
        <BigNumber label="In college account" value={formatMoney(data.sums.clearedCents)} />
        {data.fundingType === 'bjo' ? (
          <BigNumber label="Claimed from BJO" value={formatMoney(data.sums.funderCents)} />
        ) : data.fundingType === 'intl' ? (
          <BigNumber label="Held by agent" value={formatMoney(data.sums.heldCents)} />
        ) : (
          <BigNumber label="Outstanding" value={formatMoney(data.sums.outstandingCents)} />
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Instalment plan</h2>
        <div className="space-y-3">
          {data.instalments.map((inst) => (
            <InstalmentCard key={inst.index} inst={inst} student={data} role={user?.role} isPartnerOwner={isPartnerOwner} onAction={handleAction} busy={busy} />
          ))}
        </div>
      </div>

      {program?.clearBeforeDays != null ? (
        <p className="text-sm text-muted-foreground">
          All instalments must clear before {program.clearBeforeDays} days of program start ({formatFeeDate(data.cohortStart)}).
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">This program is billed monthly with no fixed clear-before rule.</p>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Ledger history</h2>
        <div className="space-y-2">
          {(data.history || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          ) : (
            data.history.map((e) => (
              <div key={e._id} className="flex items-start gap-2 text-sm border-b last:border-b-0 pb-2 last:pb-0">
                <ToneBadge tone={e.tone} className="shrink-0">
                  {e.tag}
                </ToneBadge>
                <div className="min-w-0">
                  <p className="text-gray-700">{e.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString('en-US')} {e.actorId?.name ? `· ${e.actorId.name}` : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground border-t pt-3">
        Only the registrar (or an admin) can confirm cash as cleared in the college account. A partner logging a receipt records what they say they
        collected — it does not move money until the college confirms it.
      </p>

      <QuickActionModal
        open={quickAction?.kind === 'log-receipt'}
        onOpenChange={(o) => !o && setQuickAction(null)}
        title="Log a receipt"
        instalment={quickAction ? data.instalments[quickAction.idx] : null}
        submitLabel="Log receipt"
        successMessage="Receipt logged to the shared ledger — college sees it immediately as paid by student, unpaid by agent."
        onSubmit={(amountCents, date) => feesApi.logReceipt(id, quickAction.idx, { amountCents, date }).then(load)}
      />
      <QuickActionModal
        open={quickAction?.kind === 'record-direct'}
        onOpenChange={(o) => !o && setQuickAction(null)}
        title="Record direct payment"
        instalment={quickAction ? data.instalments[quickAction.idx] : null}
        submitLabel="Record payment"
        successMessage="Direct payment recorded and cleared."
        onSubmit={(amountCents, date) => feesApi.recordDirectPayment(id, quickAction.idx, { amountCents, date }).then(load)}
      />
    </div>
  );
}
