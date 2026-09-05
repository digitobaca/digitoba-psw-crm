import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';

const todayISO = () => new Date().toISOString().slice(0, 10);

/**
 * Shared shape for "Log a receipt" and "Record direct payment" — both are
 * Student (only students with an open qualifying instalment) · Instalment
 * (auto-selects the first open one) · Amount (prefilled with invoiced) ·
 * Date, per BUILD PROMPT section 6.
 */
export default function InstalmentActionModal({ open, onOpenChange, title, description, students, instalmentFilter, submitLabel, onSubmit, successMessage }) {
  const { toast } = useToast();
  const [studentId, setStudentId] = useState('');
  const [idx, setIdx] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const eligibleStudents = useMemo(
    () => (students || []).filter((s) => (s.instalments || []).some((i, i2) => instalmentFilter(i, i2))),
    [students, instalmentFilter]
  );
  const selectedStudent = eligibleStudents.find((s) => s._id === studentId);
  const eligibleInstalments = useMemo(
    () => (selectedStudent ? selectedStudent.instalments.map((i, i2) => ({ ...i, index: i2 })).filter((i) => instalmentFilter(i, i.index)) : []),
    [selectedStudent, instalmentFilter]
  );
  const selectedInstalment = eligibleInstalments.find((i) => String(i.index) === String(idx));

  useEffect(() => {
    if (!open) {
      setStudentId('');
      setIdx('');
      setAmount('');
      setDate(todayISO());
      setError('');
    }
  }, [open]);

  useEffect(() => {
    if (eligibleInstalments.length > 0) {
      setIdx(String(eligibleInstalments[0].index));
      setAmount(String(eligibleInstalments[0].amountCents / 100));
    } else {
      setIdx('');
      setAmount('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  useEffect(() => {
    if (selectedInstalment) setAmount(String(selectedInstalment.amountCents / 100));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  const handleSubmit = async () => {
    if (!studentId || idx === '' || !amount || !date) {
      setError('Student, instalment, amount, and date are all required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(studentId, Number(idx), Math.round(Number(amount) * 100), date);
      toast({ title: successMessage || 'Saved' });
      onOpenChange(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue placeholder={eligibleStudents.length ? 'Select a student' : 'No students with an open instalment'} />
              </SelectTrigger>
              <SelectContent>
                {eligibleStudents.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.sid} · {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStudent && (
            <div>
              <Label>Instalment</Label>
              <Select value={idx} onValueChange={setIdx}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {eligibleInstalments.map((i) => (
                    <SelectItem key={i.index} value={String(i.index)}>
                      {i.label} — {formatMoney(i.amountCents)} (due {formatFeeDate(i.dueDate)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !studentId}>
            {saving ? 'Saving...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
