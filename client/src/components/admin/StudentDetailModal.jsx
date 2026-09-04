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
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import ContactLogTab from '@/components/admin/ContactLogTab.jsx';
import StudentMessagesTab from '@/components/admin/StudentMessagesTab.jsx';
import DocumentsTab from '@/components/admin/DocumentsTab.jsx';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import * as api from '@/lib/api';

/**
 * The lead-qualification pipeline: New Lead → Cold Attempt 1/2/3 → Warm Lead
 * → Hot Lead → Interested → Enrolled, plus side/terminal outcomes a lead can
 * land on from anywhere in that flow. Both roles can move a case freely
 * through any of these — no admin handoff gate (a separate Application
 * record, managed from the Applications tab, tracks the actual
 * college-application/visa process once a lead is serious).
 */
const FORWARD_STAGES = ['New Lead', 'Cold Attempt 1', 'Cold Attempt 2', 'Cold Attempt 3', 'Warm Lead', 'Hot Lead', 'Interested', 'Enrolled'];
const TERMINAL_STAGES = ['Not Interested', 'Counselled Not Enrolled', 'Hold Lead', 'BJO'];
const STAGE_OPTIONS = [...FORWARD_STAGES, ...TERMINAL_STAGES];

/** Full student CRM record: pipeline stage, counsellor assignment, notes timeline, portal activation. */
export default function StudentDetailModal({ student, open, onOpenChange, onUpdated, onDeleted }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { toast } = useToast();
  const [stage, setStage] = useState('New Lead');
  const [assignedCounsellor, setAssignedCounsellor] = useState('');
  const [counsellors, setCounsellors] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (student) {
      setStage(student.pipelineStage);
      setAssignedCounsellor(student.assignedCounsellor?._id || student.assignedCounsellor || '');
    }
  }, [student]);

  useEffect(() => {
    if (open) {
      api
        .fetchCounsellors()
        .then((res) => setCounsellors(res.data))
        .catch(() => {});
    }
  }, [open]);

  if (!student) return null;

  const handleSaveStage = async () => {
    setSaving(true);
    try {
      const res = await api.updateStudent(student._id, {
        pipelineStage: stage,
        assignedCounsellor: assignedCounsellor || null,
      });
      toast({ title: 'Student updated' });
      onUpdated?.(res.data);
    } catch (err) {
      toast({ title: 'Update failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    try {
      const res = await api.addStudentNote(student._id, newNote.trim());
      toast({ title: 'Note added' });
      setNewNote('');
      onUpdated?.(res.data);
    } catch (err) {
      toast({ title: 'Could not add note', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const handleActivatePortal = async () => {
    setActivating(true);
    try {
      await api.activateStudentPortal(student._id);
      toast({ title: 'Portal activated', description: 'Login credentials emailed to the student.' });
    } catch (err) {
      toast({ title: 'Could not activate portal', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setActivating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete the record for ${student.name}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await api.deleteStudent(student._id);
      toast({ title: 'Student deleted' });
      onDeleted?.(student._id);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Delete failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{student.name}</DialogTitle>
          <DialogDescription>
            {student.email} &middot; {student.phone} &middot; Lead score: <strong>{student.leadScore ?? 0}</strong>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact Log</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="portal">Portal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Country / City</p>
                <p className="font-medium">{[student.city, student.country].filter(Boolean).join(', ') || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Education</p>
                <p className="font-medium">{student.education || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Program</p>
                <p className="font-medium">{student.intendedProgram || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium">{student.immigrationStatus || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Source</p>
                <p className="font-medium">{student.leadSource}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Last Contact</p>
                <p className="font-medium">
                  {student.lastContactStatus ? (
                    <>
                      {student.lastContactStatus}
                      {student.lastContactAt && <span className="text-muted-foreground font-normal"> · {formatDate(student.lastContactAt)}</span>}
                    </>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
            </div>

            {student.message && (
              <div className="text-sm">
                <p className="text-muted-foreground">Message</p>
                <p className="mt-1 rounded-md bg-secondary/50 p-3">{student.message}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Pipeline Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Assigned Counsellor</Label>
              <Select value={assignedCounsellor || 'unassigned'} onValueChange={(v) => setAssignedCounsellor(v === 'unassigned' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {counsellors.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="gap-2 !mt-6">
              {isAdmin && (
                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="sm:mr-auto">
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStage} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="contact">
            <ContactLogTab student={student} onLogged={(patch) => onUpdated?.({ ...student, ...patch })} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab student={student} />
          </TabsContent>

          <TabsContent value="messages">
            {student.portalActive ? (
              <StudentMessagesTab student={student} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Chat opens up once the student's portal is activated — see the Portal tab.
              </p>
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <div className="max-h-64 overflow-y-auto space-y-3">
              {student.counsellorNotes?.length ? (
                [...student.counsellorNotes].reverse().map((note) => (
                  <div key={note._id} className="rounded-md border p-3 text-sm">
                    <p className="text-gray-700">{note.text}</p>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {note.author?.name || 'Unknown'} &middot; {formatDate(note.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-note">Add a note</Label>
              <Textarea id="new-note" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Call outcome, next steps..." />
              <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="portal" className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Portal status:</span>
              <Badge variant={student.portalActive ? 'success' : 'secondary'}>
                {student.portalActive ? 'Active' : 'Not activated'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Activating generates a temporary password and emails the student their portal login
              (<code>{window.location.origin}/portal/login</code>).
            </p>
            <Button onClick={handleActivatePortal} disabled={activating}>
              {activating ? 'Activating...' : student.portalActive ? 'Reset Portal Password' : 'Activate Student Portal'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
