import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea.jsx';
import { LogOut } from '@/components/animate-ui/icons';
import { formatTime } from '@/lib/utils';

/**
 * Shown when a staff member clicks "Log Out" — ends their shift and asks
 * what they got done today before actually signing them out. The summary
 * is encouraged, not force-blocked: "Skip & Log Out" still works, since a
 * mandatory field here would be a bad time to discover you can't sign out.
 */
export default function ShiftEndDialog({ open, onOpenChange, shift, onConfirm }) {
  const [summary, setSummary] = useState('');
  const [ending, setEnding] = useState(false);

  const handleEnd = async () => {
    setEnding(true);
    try {
      await onConfirm(summary.trim());
    } finally {
      setEnding(false);
      setSummary('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>End Your Shift</DialogTitle>
          <DialogDescription>
            {shift?.shiftStart
              ? `Shift started at ${formatTime(shift.shiftStart)}. `
              : ''}
            What did you get done today?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label htmlFor="shift-summary">Today&apos;s Summary</Label>
          <Textarea
            id="shift-summary"
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="e.g. Called 8 new leads, followed up with 3 pending applications, uploaded documents for Priya S."
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleEnd} disabled={ending}>
            {ending ? 'Ending shift...' : 'Skip & Log Out'}
          </Button>
          <Button className="gap-1.5" onClick={handleEnd} disabled={ending || !summary.trim()}>
            {ending ? 'Ending shift...' : 'End Shift & Log Out'}
            <LogOut size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
