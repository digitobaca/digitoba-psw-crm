import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

const emptyCollege = { name: '', province: '', campuses: '', website: '', officialNotes: '', internalNotes: '', verified: false };
const emptyProgram = { name: '', level: 'Diploma', field: '', durationMonths: '', tuitionAmount: '', admissionRequirements: '' };

/** Create/edit a College, and manage its Programs, in one dialog. */
export default function CollegeFormModal({ college, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const isEdit = !!college;
  const [form, setForm] = useState(emptyCollege);
  const [programs, setPrograms] = useState([]);
  const [newProgram, setNewProgram] = useState(emptyProgram);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        college
          ? {
              name: college.name,
              province: college.province,
              campuses: (college.campuses || []).join(', '),
              website: college.website || '',
              officialNotes: college.officialNotes || '',
              internalNotes: college.internalNotes || '',
              verified: college.verified,
            }
          : emptyCollege
      );
      setNewProgram(emptyProgram);
      if (college) {
        api.fetchPrograms({ college: college._id }).then((res) => setPrograms(res.data));
      } else {
        setPrograms([]);
      }
    }
  }, [open, college]);

  const handleSaveCollege = async () => {
    setSaving(true);
    try {
      const payload = { ...form, campuses: form.campuses.split(',').map((c) => c.trim()).filter(Boolean) };
      const res = isEdit ? await api.updateCollege(college._id, payload) : await api.createCollege(payload);
      toast({ title: isEdit ? 'College updated' : 'College created' });
      onSaved?.(res.data);
      if (!isEdit) onOpenChange(false);
    } catch (err) {
      toast({ title: 'Save failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddProgram = async () => {
    if (!newProgram.name.trim()) return;
    try {
      const res = await api.createProgram({
        ...newProgram,
        college: college._id,
        durationMonths: newProgram.durationMonths ? Number(newProgram.durationMonths) : undefined,
        tuitionAmount: newProgram.tuitionAmount ? Number(newProgram.tuitionAmount) : undefined,
      });
      setPrograms((prev) => [...prev, res.data]);
      setNewProgram(emptyProgram);
      toast({ title: 'Program added' });
    } catch (err) {
      toast({ title: 'Could not add program', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const toggleProgramVerified = async (program) => {
    const res = await api.updateProgram(program._id, { verified: !program.verified });
    setPrograms((prev) => prev.map((p) => (p._id === program._id ? res.data : p)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? college.name : 'New College'}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="programs" disabled={!isEdit}>
              Programs {isEdit && `(${programs.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>College Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Province</Label>
                <Input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Campuses (comma-separated)</Label>
              <Input value={form.campuses} onChange={(e) => setForm((f) => ({ ...f, campuses: e.target.value }))} placeholder="Toronto, Scarborough" />
            </div>
            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Official Notes (confirmed facts only)</Label>
              <Textarea rows={2} value={form.officialNotes} onChange={(e) => setForm((f) => ({ ...f, officialNotes: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes (counsellor opinions/experience)</Label>
              <Textarea rows={2} value={form.internalNotes} onChange={(e) => setForm((f) => ({ ...f, internalNotes: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-xs text-muted-foreground">Only verified colleges show on the public site.</p>
              </div>
              <Button
                type="button"
                size="sm"
                variant={form.verified ? 'default' : 'outline'}
                onClick={() => setForm((f) => ({ ...f, verified: !f.verified }))}
              >
                {form.verified ? 'Verified' : 'Mark Verified'}
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCollege} disabled={saving || !form.name || !form.province}>
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create College'}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="programs" className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {programs.map((program) => (
                <div key={program._id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">
                      {program.name} <span className="text-muted-foreground font-normal">— {program.level}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {program.tuitionAmount ? `${program.tuitionAmount} ${program.tuitionCurrency}` : 'Tuition TBD'}
                      {program.durationMonths ? ` · ${program.durationMonths} months` : ''}
                    </p>
                  </div>
                  <Badge
                    variant={program.verified ? 'success' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleProgramVerified(program)}
                  >
                    {program.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
              ))}
              {programs.length === 0 && <p className="text-sm text-muted-foreground">No programs yet.</p>}
            </div>

            <div className="rounded-md border p-3 space-y-2">
              <p className="text-sm font-medium">Add a Program</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input placeholder="Program name" value={newProgram.name} onChange={(e) => setNewProgram((p) => ({ ...p, name: e.target.value }))} />
                <Select value={newProgram.level} onValueChange={(v) => setNewProgram((p) => ({ ...p, level: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD', 'PSW Certificate'].map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Duration (months)"
                  type="number"
                  value={newProgram.durationMonths}
                  onChange={(e) => setNewProgram((p) => ({ ...p, durationMonths: e.target.value }))}
                />
                <Input
                  placeholder="Tuition (CAD)"
                  type="number"
                  value={newProgram.tuitionAmount}
                  onChange={(e) => setNewProgram((p) => ({ ...p, tuitionAmount: e.target.value }))}
                />
              </div>
              <Button size="sm" onClick={handleAddProgram} disabled={!newProgram.name.trim()}>
                Add Program
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
