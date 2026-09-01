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
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

/** Create a new Application: pick a student (by search), a college, and a program. */
export default function ApplicationFormModal({ open, onOpenChange, onCreated }) {
  const { toast } = useToast();
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [collegeId, setCollegeId] = useState('');
  const [programId, setProgramId] = useState('');
  const [intake, setIntake] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (open) {
      api.fetchColleges().then((res) => setColleges(res.data));
    } else {
      setStudentSearch('');
      setStudentResults([]);
      setSelectedStudent(null);
      setCollegeId('');
      setProgramId('');
      setIntake('');
    }
  }, [open]);

  useEffect(() => {
    if (collegeId) {
      api.fetchPrograms({ college: collegeId }).then((res) => setPrograms(res.data));
    } else {
      setPrograms([]);
    }
    setProgramId('');
  }, [collegeId]);

  useEffect(() => {
    if (!studentSearch.trim() || selectedStudent) {
      setStudentResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.fetchStudents({ search: studentSearch.trim(), limit: 5 }).then((res) => setStudentResults(res.data));
    }, 300);
    return () => clearTimeout(t);
  }, [studentSearch, selectedStudent]);

  const handleCreate = async () => {
    if (!selectedStudent || !collegeId || !programId) {
      toast({ title: 'Missing details', description: 'Pick a student, college, and program.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await api.createApplication({ student: selectedStudent._id, college: collegeId, program: programId, intake });
      toast({ title: 'Application created' });
      onCreated?.(res.data);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Could not create application', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Application</DialogTitle>
          <DialogDescription>Start an application for a student to a specific college and program.</DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <Label>Student</Label>
          {selectedStudent ? (
            <div className="flex items-center justify-between rounded-md border p-2.5 text-sm">
              <span>
                {selectedStudent.name} &middot; {selectedStudent.email}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)}>
                Change
              </Button>
            </div>
          ) : (
            <>
              <Input placeholder="Search by name, email, or phone..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} />
              {studentResults.length > 0 && (
                <div className="rounded-md border divide-y">
                  {studentResults.map((s) => (
                    <button
                      key={s._id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-secondary/50"
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentSearch('');
                        setStudentResults([]);
                      }}
                    >
                      {s.name} <span className="text-muted-foreground">— {s.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>College</Label>
            <Select value={collegeId} onValueChange={setCollegeId}>
              <SelectTrigger>
                <SelectValue placeholder="Select college" />
              </SelectTrigger>
              <SelectContent>
                {colleges.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Program</Label>
            <Select value={programId} onValueChange={setProgramId} disabled={!collegeId}>
              <SelectTrigger>
                <SelectValue placeholder={collegeId ? 'Select program' : 'Pick a college first'} />
              </SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="intake">Intake (optional)</Label>
          <Input id="intake" placeholder="e.g. Sep 2027" value={intake} onChange={(e) => setIntake(e.target.value)} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
