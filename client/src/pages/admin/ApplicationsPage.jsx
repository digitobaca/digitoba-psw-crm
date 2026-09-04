import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import ApplicationFormModal from '@/components/admin/ApplicationFormModal.jsx';
import ApplicationDetailModal from '@/components/admin/ApplicationDetailModal.jsx';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import * as api from '@/lib/api';

const STAGE_VARIANT = {
  'College Selected': 'secondary',
  'Documents Ready': 'secondary',
  Submitted: 'info',
  'Application Number Received': 'info',
  Offer: 'success',
  Refusal: 'destructive',
  'Deposit Paid': 'success',
  'LOA Received': 'success',
  'Visa Filed': 'warning',
  'Visa Approved': 'success',
  Enrolled: 'success',
};

/**
 * Every application across the CRM (scoped to a counsellor's own students
 * server-side). Creating and managing an application — "College Selected"
 * through to admission details — is admin-only, enforced server-side too;
 * a counsellor gets a read-only list here to track progress on their cases.
 */
export default function ApplicationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .fetchApplications()
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpdated = (updated) => {
    setApplications((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-sm text-muted-foreground">
            {applications.length} application(s){!isAdmin && ' — read-only; an admin manages these'}
          </p>
        </div>
        {isAdmin && <Button onClick={() => setModalOpen(true)}>New Application</Button>}
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : applications.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No applications yet. Create one to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>College / Program</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Created</TableHead>
                {isAdmin && <TableHead>Manage</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app._id}>
                  <TableCell className="font-medium">{app.student?.name}</TableCell>
                  <TableCell className="text-sm">
                    {app.college?.name}
                    <div className="text-xs text-muted-foreground">{app.program?.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STAGE_VARIANT[app.stage] || 'secondary'}>{app.stage}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(app.createdAt)}</TableCell>
                  {isAdmin && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApplication(app);
                          setDetailModalOpen(true);
                        }}
                      >
                        Manage
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <ApplicationFormModal open={modalOpen} onOpenChange={setModalOpen} onCreated={() => load()} />
      <ApplicationDetailModal
        application={selectedApplication}
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        onUpdated={handleUpdated}
      />
    </>
  );
}
