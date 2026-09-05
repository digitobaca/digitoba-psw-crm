import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import { REASON_LABELS } from '@/features/fees/constants';
import * as feesApi from '@/features/fees/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function RefundCalculatorModal({ open, onOpenChange, student, onApproved }) {
  const { toast } = useToast();
  const [reason, setReason] = useState('before');
  const [noticeDate, setNoticeDate] = useState(todayISO());
  const [hoursDelivered, setHoursDelivered] = useState('0');
  const [booksReturned, setBooksReturned] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setReason('before');
      setNoticeDate(todayISO());
      setHoursDelivered('0');
      setBooksReturned(false);
      setPreview(null);
      setError('');
    }
  }, [open, student]);

  useEffect(() => {
    if (!open || !student) return;
    setPreviewLoading(true);
    const t = setTimeout(() => {
      feesApi
        .previewFeeRefund({
          studentId: student._id,
          noticeDate,
          reason,
          hoursDelivered: reason === 'after' ? Number(hoursDelivered) || 0 : 0,
          booksReturned,
        })
        .then((res) => setPreview(res.data))
        .catch(() => setPreview(null))
        .finally(() => setPreviewLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [open, student, reason, noticeDate, hoursDelivered, booksReturned]);

  const handleApprove = async () => {
    setSaving(true);
    setError('');
    try {
      await feesApi.approveFeeRefund({
        studentId: student._id,
        noticeDate,
        reason,
        hoursDelivered: reason === 'after' ? Number(hoursDelivered) || 0 : 0,
        booksReturned,
      });
      toast({ title: 'Refund approved' });
      onOpenChange(false);
      onApproved?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve the refund.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Refund calculator — {student.name}</DialogTitle>
          <DialogDescription>Under Ontario Regulation 415/06. Confirm the citation applies before approving.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(REASON_LABELS).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r === 'rescind' ? 'Rescinded' : r === 'before' ? 'Before program start' : r === 'visa' ? 'Study permit refused' : 'After program start'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{REASON_LABELS[reason]}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Notice date</Label>
              <Input type="date" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
            </div>
            {reason === 'after' && (
              <div>
                <Label>Training hours delivered</Label>
                <Input type="number" min="0" value={hoursDelivered} onChange={(e) => setHoursDelivered(e.target.value)} />
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={booksReturned} onChange={(e) => setBooksReturned(e.target.checked)} className="h-4 w-4" />
            Books returned in resalable condition (waives the books fee retention)
          </label>

          <div className="rounded-lg border p-3 bg-secondary/30 text-sm">
            {previewLoading || !preview ? (
              <p className="text-muted-foreground">Calculating...</p>
            ) : (
              <div className="space-y-1.5">
                <Row label="Fees confirmed received" value={formatMoney(student.sums?.clearedCents)} />
                <Row label="Less service fee" value={`-${formatMoney(preview.retainServiceCents)}`} />
                <Row label={`Less earned fee (${Math.round(preview.frac * 100)}% delivered)`} value={`-${formatMoney(preview.earnedCents)}`} />
                <Row label="Less books" value={`-${formatMoney(preview.booksCents)}`} />
                <div className="flex items-center justify-between pt-1.5 border-t font-semibold text-base">
                  <span>Refund (due by {formatFeeDate(preview.dueBy)})</span>
                  <span>{formatMoney(preview.refundCents)}</span>
                </div>
                {preview.pastMidpoint && (
                  <p className="text-xs text-red-600 font-medium">Past the program midpoint — no refund is owed under s. 27.</p>
                )}
                <Row label="Partner clawback" value={formatMoney(preview.clawbackCents)} />
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApprove} disabled={saving || previewLoading}>
            {saving ? 'Approving...' : 'Approve refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between text-gray-700">
      <span>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
