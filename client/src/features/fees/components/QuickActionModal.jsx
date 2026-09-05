import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/toast.jsx';

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * A single-instalment log-receipt / record-direct action, launched directly
 * from an instalment card on the student ledger (already knows which
 * student + instalment — no picker needed, unlike the toolbar-level
 * InstalmentActionModal on the Students page).
 */
export default function QuickActionModal({ open, onOpenChange, title, instalment, submitLabel, onSubmit, successMessage }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && instalment) {
      setAmount(String(instalment.amountCents / 100));
      setDate(todayISO());
      setError('');
    }
  }, [open, instalment]);

  const handleSubmit = async () => {
    if (!amount || !date) {
      setError('Amount and date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(Math.round(Number(amount) * 100), date);
      toast({ title: successMessage || 'Saved' });
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (!instalment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{instalment.label} — invoiced amount prefilled below.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Amount (CAD)</Label>
            <Input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
