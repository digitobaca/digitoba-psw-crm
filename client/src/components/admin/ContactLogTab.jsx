import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatDate, formatTime } from '@/lib/utils';
import * as api from '@/lib/api';

const STATUS_OPTIONS = ['Contacted', 'Not Contacted', 'No Response'];
const STATUS_VARIANT = { Contacted: 'success', 'Not Contacted': 'secondary', 'No Response': 'warning' };

/**
 * Quick contact-attempt logger — a counsellor picks what happened on this
 * attempt, and (only if they actually reached the student) what they
 * learned. Every entry also updates the student's lastContactStatus, which
 * is what the admin students table's "Last Contact" column reads.
 */
export default function ContactLogTab({ student, onLogged }) {
  const { toast } = useToast();
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [logging, setLogging] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = () => {
    setLoadingHistory(true);
    api
      .fetchCommunications(student._id, 'log')
      .then((res) => setHistory(res.data))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(loadHistory, [student._id]);

  const needsNotes = status === 'Contacted';

  const handleLog = async () => {
    if (!status) return;
    if (needsNotes && !notes.trim()) {
      toast({ title: 'Add a quick note', description: 'What did you learn from the student?', variant: 'destructive' });
      return;
    }

    setLogging(true);
    try {
      await api.createCommunication({
        student: student._id,
        channel: 'Call',
        contactStatus: status,
        message: notes.trim(),
      });
      toast({ title: 'Contact logged' });
      setStatus('');
      setNotes('');
      loadHistory();
      onLogged?.({ lastContactStatus: status, lastContactAt: new Date().toISOString() });
    } catch (err) {
      toast({ title: 'Could not log contact', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="space-y-1.5">
          <Label>Outcome of this contact attempt</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select what happened" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {needsNotes && (
          <div className="space-y-1.5">
            <Label htmlFor="contact-notes">What did you get from the student?</Label>
            <Textarea
              id="contact-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Interested in the PSW pathway, has IELTS 6.5, needs financial docs..."
            />
          </div>
        )}

        <Button size="sm" onClick={handleLog} disabled={!status || logging}>
          {logging ? 'Logging...' : 'Log Contact'}
        </Button>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-900 mb-2">Contact History</p>
        <div className="max-h-56 overflow-y-auto space-y-2">
          {loadingHistory ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contact attempts logged yet.</p>
          ) : (
            history.map((log) => (
              <div key={log._id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {log.contactStatus && <Badge variant={STATUS_VARIANT[log.contactStatus]}>{log.contactStatus}</Badge>}
                    <span className="text-xs text-muted-foreground">{log.channel}</span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDate(log.createdAt)} {formatTime(log.createdAt)}
                  </span>
                </div>
                {log.message && <p className="mt-1.5 text-gray-700">{log.message}</p>}
                <p className="mt-1 text-xs text-muted-foreground">{log.counsellor?.name || 'System'}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
