import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import SummaryTiles from '@/features/fees/components/SummaryTiles.jsx';
import PlanSegmentBar from '@/features/fees/components/PlanSegmentBar.jsx';
import AddStudentModal from '@/features/fees/components/AddStudentModal.jsx';
import InstalmentActionModal from '@/features/fees/components/InstalmentActionModal.jsx';
import { formatMoney, formatFeeDate, isPast } from '@/features/fees/format';
import { FUNDING_LABELS } from '@/features/fees/constants';
import * as feesApi from '@/features/fees/api';

const REGISTRAR_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'New applications' },
  { value: 'agent', label: 'Held by agent' },
  { value: 'bjo', label: 'BJO' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'direct', label: 'Direct payers' },
];
const PARTNER_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'agent', label: 'I hold money' },
  { value: 'overdue', label: 'Overdue' },
];

export default function StudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isRegistrarLike = ['admin', 'registrar'].includes(user?.role);

  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [logReceiptOpen, setLogReceiptOpen] = useState(false);
  const [recordDirectOpen, setRecordDirectOpen] = useState(false);

  const loadSummary = () => feesApi.fetchFeeSummary().then((res) => setSummary(res.data)).catch(() => {});
  const loadStudents = () => {
    setLoading(true);
    return feesApi
      .fetchFeeStudents({ filter, q: q || undefined, limit: 100 })
      .then((res) => setStudents(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(loadSummary, []);
  useEffect(() => {
    const t = setTimeout(loadStudents, 250); // light debounce on search
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q]);

  useEffect(() => {
    feesApi.fetchFeePrograms().then((res) => setPrograms(res.data)); // programs are readable by every fee role
    if (isRegistrarLike || user?.role === 'partner') feesApi.fetchFeePartners().then((res) => setPartners(res.data));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshAll = () => {
    loadSummary();
    loadStudents();
  };

  const filters = user?.role === 'partner' ? PARTNER_FILTERS : REGISTRAR_FILTERS;
  const subtitle = summary
    ? `${summary.studentCount} student${summary.studentCount === 1 ? '' : 's'} · ${summary.partnerCount} recruitment partner${summary.partnerCount === 1 ? '' : 's'} · ${summary.programCount} program${summary.programCount === 1 ? '' : 's'}`
    : '';

  const payerLabel = (s) => {
    if (s.fundingType === 'bjo') return 'Ministry claim · no commission';
    if (s.fundingType === 'self') return 'Pays college directly';
    return s.partnerId ? `${s.partnerId.name} · ${s.partnerId.city || ''}` : '—';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee ledger</h1>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isRegistrarLike && (
            <>
              <Button variant="outline" onClick={() => setRecordDirectOpen(true)}>
                Record direct payment
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                Add student
              </Button>
            </>
          )}
          {(isRegistrarLike || user?.role === 'partner') && <Button onClick={() => setLogReceiptOpen(true)}>Log a receipt</Button>}
        </div>
      </div>

      <SummaryTiles summary={summary} role={user?.role} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filters.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Search sid, name, program, partner..." className="sm:w-72" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : students.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No students match this filter yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Funding</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead className="min-w-[160px]">Fee plan</TableHead>
                  <TableHead>Total fee</TableHead>
                  <TableHead>Cleared</TableHead>
                  <TableHead>Held / pending</TableHead>
                  <TableHead>Next due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const nextDue = s.sums.nextDue;
                  const overdue = typeof nextDue === 'object' && isPast(nextDue.dueDate);
                  return (
                    <TableRow key={s._id} className="cursor-pointer" onClick={() => navigate(`/fees/students/${s._id}`)}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.name}
                        <div className="text-xs text-muted-foreground">{s.sid}</div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{s.programId?.name}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{FUNDING_LABELS[s.fundingType]}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{payerLabel(s)}</TableCell>
                      <TableCell>
                        <PlanSegmentBar instalments={s.instalments} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.totalCents)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.clearedCents)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.heldCents)}</TableCell>
                      <TableCell className={`text-sm whitespace-nowrap ${overdue ? 'text-red-600 font-semibold' : ''}`}>
                        {nextDue === 'Cleared' ? 'Cleared' : `${nextDue.label} · ${formatFeeDate(nextDue.dueDate)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <AddStudentModal open={addOpen} onOpenChange={setAddOpen} programs={programs} partners={partners} onCreated={refreshAll} />

      <InstalmentActionModal
        open={logReceiptOpen}
        onOpenChange={setLogReceiptOpen}
        title="Log a receipt"
        description="Record money a partner (or you, on their behalf) collected from a student. The college still needs to confirm the cash separately."
        students={students}
        instalmentFilter={(inst) => (inst.effectiveStatus === 'due' || inst.effectiveStatus === 'overdue') && inst.channel === 'agent'}
        submitLabel="Log receipt"
        successMessage="Receipt logged to the shared ledger — college sees it immediately as paid by student, unpaid by agent."
        onSubmit={(studentId, idx, amountCents, date) => feesApi.logReceipt(studentId, idx, { amountCents, date }).then(refreshAll)}
      />

      <InstalmentActionModal
        open={recordDirectOpen}
        onOpenChange={setRecordDirectOpen}
        title="Record direct payment"
        description="For a student who paid the college directly, bypassing a partner."
        students={students}
        instalmentFilter={(inst) => inst.effectiveStatus === 'due' || inst.effectiveStatus === 'overdue'}
        submitLabel="Record payment"
        successMessage="Direct payment recorded and cleared."
        onSubmit={(studentId, idx, amountCents, date) => feesApi.recordDirectPayment(studentId, idx, { amountCents, date }).then(refreshAll)}
      />
    </div>
  );
}
