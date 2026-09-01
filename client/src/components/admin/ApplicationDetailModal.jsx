import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

const STAGES = [
  'College Selected',
  'Documents Ready',
  'Submitted',
  'Application Number Received',
  'Offer',
  'Refusal',
  'Deposit Paid',
  'LOA Received',
  'Visa Filed',
  'Visa Approved',
  'Enrolled',
];

/**
 * Admin manages an application end to end — stage, application number, and
 * the full admission details once the college confirms — no separate
 * external portal involved.
 */
export default function ApplicationDetailModal({ application, open, onOpenChange, onUpdated }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ stage: '', applicationNumber: '', admissionStartDate: '', admissionDetails: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (application) {
      setForm({
        stage: application.stage,
        applicationNumber: application.applicationNumber || '',
        admissionStartDate: application.admissionStartDate ? application.admissionStartDate.slice(0, 10) : '',
        admissionDetails: application.admissionDetails || '',
      });
    }
  }, [application]);

  if (!application) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.updateApplication(application._id, form);
      toast({ title: 'Application updated' });
      onUpdated?.(res.data);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Update failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{application.student?.name}</DialogTitle>
          <DialogDescription>
            {application.college?.name} &middot; {application.program?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Application Stage</Label>
          <Select value={form.stage} onValueChange={(v) => setForm((f) => ({ ...f, stage: v }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="app-number">Application Number</Label>
            <Input
              id="app-number"
              value={form.applicationNumber}
              onChange={(e) => setForm((f) => ({ ...f, applicationNumber: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="start-date">Admission Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={form.admissionStartDate}
              onChange={(e) => setForm((f) => ({ ...f, admissionStartDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="admission-details">Full Admission Details</Label>
          <Textarea
            id="admission-details"
            rows={4}
            value={form.admissionDetails}
            onChange={(e) => setForm((f) => ({ ...f, admissionDetails: e.target.value }))}
            placeholder="Offer letter reference, LOA number, tuition deposit due date, conditions, next steps..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
