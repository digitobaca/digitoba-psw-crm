import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Loader } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import StudentsTable from '@/components/admin/StudentsTable.jsx';
import StudentDetailModal from '@/components/admin/StudentDetailModal.jsx';
import CounsellorTodayPanel from '@/components/admin/CounsellorTodayPanel.jsx';
import { useAuth } from '@/hooks/useAuth';
import * as api from '@/lib/api';

const PENDING_REVIEW_POLL_MS = 20000;

const STAGE_FILTERS = [
  'All',
  'New Lead',
  'Contacted',
  'Qualified',
  'Counselling',
  'Profile Complete',
  'College Shortlist',
  'Documents',
  'Submitted for Review',
  'Application',
  'Offer',
  'Deposit',
  'Visa',
  'Approved',
  'Pre-Departure',
  'Student in Canada',
  'Closed',
];

/**
 * The CRM's central "Students" view. Serves both roles: an admin sees every
 * student, a counsellor sees only their own (enforced server-side) — this
 * one screen doubles as the counsellor dashboard's student list, with the
 * "Today" tasks panel shown only for counsellors.
 */
export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (stage !== 'All') params.pipelineStage = stage;
      if (search.trim()) params.search = search.trim();
      const res = await api.fetchStudents(params);
      setStudents(res.data);
      setPagination(res.pagination);
      // Already have the exact count when viewing this filter — skip the extra request.
      if (stage === 'Submitted for Review') setPendingReviewCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load students:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, stage, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // Admin-only "how many cases are waiting on me" badge — polled so it stays
  // current even while parked on a different stage filter.
  useEffect(() => {
    if (!isAdmin) return;
    const poll = () => api.fetchPendingReviewCount().then(setPendingReviewCount).catch(() => {});
    poll();
    const interval = setInterval(poll, PENDING_REVIEW_POLL_MS);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Debounce free-text search so we don't fire a request on every keystroke.
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openStudent = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleUpdated = (updated) => {
    setStudents((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
  };

  const handleDeleted = (id) => {
    setStudents((prev) => prev.filter((s) => s._id !== id));
  };

  return (
    <>
      {user?.role === 'counsellor' && <CounsellorTodayPanel />}

      {isAdmin && pendingReviewCount > 0 && stage !== 'Submitted for Review' && (
        <button
          type="button"
          onClick={() => {
            setStage('Submitted for Review');
            setPage(1);
          }}
          className="mb-4 flex w-full items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-left text-sm text-indigo-900 transition-colors hover:bg-indigo-100"
        >
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-semibold text-white">
            {pendingReviewCount}
          </span>
          <span className="font-medium">
            {pendingReviewCount === 1 ? 'student is' : 'students are'} waiting on your review
          </span>
          <span className="ml-auto text-indigo-700">View →</span>
        </button>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name, email, phone..."
              className="pl-8 sm:w-64"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            value={stage}
            onValueChange={(v) => {
              setStage(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGE_FILTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={loadStudents} aria-label="Refresh">
            <Loader size={16} animation="spin" animate={loading ? 'spin' : false} />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <StudentsTable students={students} loading={loading} onRowClick={openStudent} />
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {pagination.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <StudentDetailModal
        student={selectedStudent}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdated={handleUpdated}
        onDeleted={handleDeleted}
      />
    </>
  );
}
