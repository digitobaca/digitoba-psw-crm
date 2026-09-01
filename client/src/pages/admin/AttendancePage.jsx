import { useEffect, useMemo, useState } from 'react';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { Download } from 'lucide-react';
import { useToast } from '@/components/ui/toast.jsx';
import { formatDate, formatTime, formatDuration } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import * as api from '@/lib/api';

/** Local calendar-day key (not UTC) so grouping matches what's on screen. */
const dayKey = (dateString) => {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Staff → day → individual login sessions, each level with its own totals. */
function groupAttendance(records) {
  const byStaff = new Map();
  for (const r of records) {
    const staffId = r.user?._id || 'unknown';
    if (!byStaff.has(staffId)) byStaff.set(staffId, { user: r.user, shifts: [] });
    byStaff.get(staffId).shifts.push(r);
  }

  return [...byStaff.values()]
    .map(({ user, shifts }) => {
      const byDay = new Map();
      for (const s of shifts) {
        const key = dayKey(s.shiftStart);
        if (!byDay.has(key)) byDay.set(key, { label: formatDate(s.shiftStart), shifts: [] });
        byDay.get(key).shifts.push(s);
      }
      const days = [...byDay.entries()]
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, { label, shifts }]) => ({
          key,
          label,
          shifts: [...shifts].sort((a, b) => new Date(b.shiftStart) - new Date(a.shiftStart)),
          totalMinutes: shifts.reduce((sum, s) => sum + (s.durationMinutes || 0), 0),
        }));
      const totalMinutes = days.reduce((sum, d) => sum + d.totalMinutes, 0);
      return { user, days, totalMinutes, totalShifts: shifts.length };
    })
    .sort((a, b) => (a.user?.name || '').localeCompare(b.user?.name || ''));
}

/**
 * Attendance / shift log — grouped Staff → Day → each login session, so a
 * team's history reads as a real report instead of one long flat table.
 * Admins see every staff member (with name + date-range filters and an
 * Excel export); a counsellor only ever sees their own — enforced
 * server-side by /api/attendance, this page just doesn't show the admin
 * controls for them.
 */
export default function AttendancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  const [records, setRecords] = useState([]);
  const [counsellors, setCounsellors] = useState([]);
  const [userFilter, setUserFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      api.fetchCounsellors().then((res) => setCounsellors(res.data));
    }
  }, [isAdmin]);

  const filterParams = useMemo(() => {
    const params = {};
    if (isAdmin && userFilter !== 'all') params.user = userFilter;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    return params;
  }, [isAdmin, userFilter, dateFrom, dateTo]);

  useEffect(() => {
    setLoading(true);
    api
      .fetchAttendance(filterParams)
      .then((res) => setRecords(res.data))
      .finally(() => setLoading(false));
  }, [filterParams]);

  const grouped = useMemo(() => groupAttendance(records), [records]);

  const handleClearFilters = () => {
    setUserFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await api.downloadAttendanceExport(filterParams);
    } catch (err) {
      toast({ title: 'Export failed', description: err.response?.data?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? 'Every shift, across the whole team — grouped by staff, then by day.' : 'Your own shift history, grouped by day.'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={handleExport} disabled={exporting} variant="outline" className="gap-1.5">
            <Download size={16} /> {exporting ? 'Preparing...' : 'Download Excel'}
          </Button>
        )}
      </div>

      {isAdmin && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-white p-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Staff</Label>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                {counsellors.map((c) => (
                  <SelectItem key={c._id} value={c._id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          </div>
          {(userFilter !== 'all' || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : grouped.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No shifts recorded yet.</p>
        ) : (
          <Accordion type="multiple" defaultValue={isAdmin ? [] : [grouped[0]?.user?._id]} className="divide-y">
            {grouped.map((staff) => (
              <AccordionItem key={staff.user?._id || 'unknown'} value={staff.user?._id || 'unknown'} className="px-4 border-b-0">
                <AccordionTrigger>
                  <div className="flex flex-1 items-center gap-3 flex-wrap pr-3">
                    <span className="font-semibold text-gray-900">{staff.user?.name || 'Unknown'}</span>
                    {staff.user?.role && (
                      <Badge variant={staff.user.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {staff.user.role}
                      </Badge>
                    )}
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      {staff.totalShifts} login{staff.totalShifts !== 1 ? 's' : ''} &middot; {formatDuration(staff.totalMinutes)} total
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <Accordion type="multiple" defaultValue={[staff.days[0]?.key]} className="rounded-lg border divide-y">
                    {staff.days.map((day) => (
                      <AccordionItem key={day.key} value={day.key} className="px-3 border-b-0">
                        <AccordionTrigger className="py-3">
                          <div className="flex flex-1 items-center gap-3">
                            <span className="text-sm font-medium text-gray-800">{day.label}</span>
                            <span className="ml-auto text-xs font-normal text-muted-foreground">
                              {day.shifts.length} login{day.shifts.length !== 1 ? 's' : ''} &middot; {formatDuration(day.totalMinutes)}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2">
                            {day.shifts.map((s) => (
                              <div key={s._id} className="rounded-md border bg-secondary/30 p-3 text-sm">
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                                  <span>
                                    <span className="text-muted-foreground">Start </span>
                                    <span className="font-medium">{formatTime(s.shiftStart)}</span>
                                  </span>
                                  <span>
                                    <span className="text-muted-foreground">End </span>
                                    <span className="font-medium">{s.shiftEnd ? formatTime(s.shiftEnd) : '—'}</span>
                                  </span>
                                  <span>
                                    {s.status === 'Active' ? (
                                      <Badge variant="info">Ongoing</Badge>
                                    ) : (
                                      <>
                                        <span className="text-muted-foreground">Duration </span>
                                        <span className="font-medium">{formatDuration(s.durationMinutes)}</span>
                                      </>
                                    )}
                                  </span>
                                </div>
                                {s.summary && <p className="mt-2 text-gray-600">{s.summary}</p>}
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
