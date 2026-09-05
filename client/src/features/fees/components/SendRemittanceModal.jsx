import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

const todayISO = () => new Date().toISOString().slice(0, 10);

/** Partner flow: multi-select their held (agent, unbatched) instalments, enter a wire ref + sent date, and create a remittance batch. */
export default function SendRemittanceModal({ open, onOpenChange, partnerId, students, onCreated }) {
  const { toast } = useToast();
  const [selected, setSelected] = useState({}); // `${studentId}:${idx}` -> true
  const [wireRef, setWireRef] = useState('');
  const [sentOn, setSentOn] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const heldItems = useMemo(() => {
    const items = [];
    (students || []).forEach((s) => {
      (s.instalments || []).forEach((inst, idx) => {
        if (inst.effectiveStatus === 'agent') items.push({ student: s, idx, inst });
      });
    });
    return items;
  }, [students]);

  useEffect(() => {
    if (!open) {
      setSelected({});
      setWireRef('');
      setSentOn(todayISO());
      setError('');
    }
  }, [open]);

  const toggle = (key) => setSelected((prev) => ({ ...prev, [key]: !prev[key] }));

  const chosen = heldItems.filter((i) => selected[`${i.student._id}:${i.idx}`]);
  const total = chosen.reduce((sum, i) => sum + (i.inst.reportedCents ?? i.inst.amountCents), 0);

  const handleSubmit = async () => {
    if (chosen.length === 0) {
      setError('Select at least one held instalment.');
      return;
    }
    if (!wireRef || !sentOn) {
      setError('A wire reference and sent date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await feesApi.createFeeBatch({
        partnerId,
        items: chosen.map((i) => ({ studentId: i.student._id, instalmentIndex: i.idx })),
        wireRef,
        sentOn,
      });
      toast({ title: 'Remittance batch created' });
      onOpenChange(false);
      onCreated?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the batch.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send remittance</DialogTitle>
          <DialogDescription>Bundle held instalments into one wire to the college.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
            {heldItems.length === 0 ? (
              <p className="text-sm text-muted-foreground p-3">No held instalments to remit right now.</p>
            ) : (
              heldItems.map(({ student, idx, inst }) => {
                const key = `${student._id}:${idx}`;
                return (
                  <label key={key} className="flex items-center gap-3 p-2.5 text-sm cursor-pointer hover:bg-secondary/40">
                    <input type="checkbox" checked={!!selected[key]} onChange={() => toggle(key)} className="h-4 w-4" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {student.name} · {inst.label}
                      </p>
                      <p className="text-xs text-muted-foreground">due {formatFeeDate(inst.dueDate)}</p>
                    </div>
                    <span className="font-medium">{formatMoney(inst.reportedCents ?? inst.amountCents)}</span>
                  </label>
                );
              })
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Wire reference</Label>
              <Input value={wireRef} onChange={(e) => setWireRef(e.target.value)} placeholder="e.g. WIRE-778241" />
            </div>
            <div>
              <Label>Sent date</Label>
              <Input type="date" value={sentOn} onChange={(e) => setSentOn(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm font-semibold border-t pt-2">
            <span>{chosen.length} instalment(s) selected</span>
            <span>{formatMoney(total)}</span>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Sending...' : 'Send remittance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
