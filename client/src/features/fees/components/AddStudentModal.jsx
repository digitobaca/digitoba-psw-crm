import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import PlanSegmentBar from '@/features/fees/components/PlanSegmentBar.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import { FUNDING_LABELS } from '@/features/fees/constants';
import * as feesApi from '@/features/fees/api';

const FUNDING_HINTS = {
  intl: 'The student pays a recruiting partner, who remits to the college — commission accrues once the college confirms cash.',
  self: 'The student pays the college directly — no partner involved, no commission.',
  bjo: 'Billed to the Ministry (Better Jobs Ontario) in three claims — no partner, no commission.',
};

export default function AddStudentModal({ open, onOpenChange, programs, partners, onCreated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', programId: '', fundingType: 'self', partnerId: '', cohortStart: '' });
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setForm({ name: '', email: '', phone: '', programId: '', fundingType: 'self', partnerId: '', cohortStart: '' });
      setPreview(null);
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (!form.programId || !form.fundingType || !form.cohortStart) {
      setPreview(null);
      return;
    }
    setPreviewLoading(true);
    feesApi
      .fetchPlanPreview({ programId: form.programId, fundingType: form.fundingType, cohortStart: form.cohortStart })
      .then((res) => setPreview(res.data))
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [form.programId, form.fundingType, form.cohortStart]);

  const program = programs.find((p) => p._id === form.programId);
  const clearRuleHint = program?.clearBeforeDays
    ? `All instalments must clear before ${program.clearBeforeDays} days of program start.`
    : 'No fixed clear-before rule for this program (billed monthly).';

  const handleSubmit = async () => {
    if (!form.name || !form.programId || !form.fundingType || !form.cohortStart) {
      setError('Name, program, funding type, and cohort start date are all required.');
      return;
    }
    if (form.fundingType === 'intl' && !form.partnerId) {
      setError('An intl (agent-recruited) student requires a recruiting partner.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await feesApi.createFeeStudent({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        programId: form.programId,
        fundingType: form.fundingType,
        partnerId: form.fundingType === 'intl' ? form.partnerId : undefined,
        cohortStart: form.cohortStart,
      });
      toast({ title: 'Student & fee plan created' });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Add student</DialogTitle>
          <DialogDescription>Creates a fee ledger student and generates their instalment plan.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="fee-student-name">Full name</Label>
            <Input id="fee-student-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>

          <div>
            <Label>Program</Label>
            <Select value={form.programId} onValueChange={(v) => setForm({ ...form, programId: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name} — {formatMoney(p.totalCents)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Who pays</Label>
            <Select value={form.fundingType} onValueChange={(v) => setForm({ ...form, fundingType: v, partnerId: '' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FUNDING_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">{FUNDING_HINTS[form.fundingType]}</p>
          </div>

          {form.fundingType === 'intl' && (
            <div>
              <Label>Recruiting partner</Label>
              <Select value={form.partnerId} onValueChange={(v) => setForm({ ...form, partnerId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a partner" />
                </SelectTrigger>
                <SelectContent>
                  {partners.map((p) => (
                    <SelectItem key={p._id} value={p._id}>
                      {p.name} — {p.city} ({p.tier}, {p.commissionRatePct}%)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Cohort start date</Label>
            <Input type="date" value={form.cohortStart} onChange={(e) => setForm({ ...form, cohortStart: e.target.value })} />
            {program && <p className="text-xs text-muted-foreground mt-1">{clearRuleHint}</p>}
          </div>

          {(previewLoading || preview) && (
            <div className="rounded-lg border p-3 bg-secondary/30">
              <p className="text-sm font-semibold text-gray-900 mb-2">Generated instalment plan</p>
              {previewLoading ? (
                <p className="text-sm text-muted-foreground">Calculating...</p>
              ) : (
                <>
                  <PlanSegmentBar instalments={preview.instalments.map((i) => ({ ...i, effectiveStatus: 'due' }))} height={10} className="mb-2" />
                  <ul className="space-y-1 text-sm">
                    {preview.instalments.map((row, i) => (
                      <li key={i} className="flex items-center justify-between">
                        <span className="text-gray-700">
                          {row.label} <span className="text-muted-foreground">· due {formatFeeDate(row.dueDate)}</span>
                        </span>
                        <span className="font-medium">{formatMoney(row.amountCents)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t font-semibold">
                    <span>Total</span>
                    <span>{formatMoney(preview.totalCents)}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating...' : 'Create student & fee plan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
