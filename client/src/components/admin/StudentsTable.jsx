import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDate } from '@/lib/utils';

const STAGE_VARIANT = {
  'New Lead': 'info',
  Contacted: 'warning',
  Qualified: 'warning',
  Counselling: 'warning',
  'Profile Complete': 'secondary',
  'College Shortlist': 'secondary',
  Documents: 'secondary',
  'Submitted for Review': 'default',
  Application: 'info',
  Offer: 'success',
  Deposit: 'success',
  Visa: 'success',
  Approved: 'success',
  'Pre-Departure': 'success',
  'Student in Canada': 'success',
  Closed: 'secondary',
};

const CONTACT_STATUS_VARIANT = { Contacted: 'success', 'Not Contacted': 'secondary', 'No Response': 'warning' };

export default function StudentsTable({ students, loading, onRowClick }) {
  if (loading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Loading students...</p>;
  }

  if (!students.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No students match your filters yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email / Phone</TableHead>
          <TableHead>Program</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>Counsellor</TableHead>
          <TableHead>Last Contact</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Received</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((student) => (
          <TableRow key={student._id} className="cursor-pointer" onClick={() => onRowClick(student)}>
            <TableCell className="font-medium">{student.name}</TableCell>
            <TableCell>
              <div className="text-sm">{student.email}</div>
              <div className="text-xs text-muted-foreground">{student.phone}</div>
            </TableCell>
            <TableCell className="text-sm">{student.intendedProgram || '—'}</TableCell>
            <TableCell>
              <Badge variant={STAGE_VARIANT[student.pipelineStage] || 'default'}>{student.pipelineStage}</Badge>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{student.assignedCounsellor?.name || 'Unassigned'}</TableCell>
            <TableCell>
              {student.lastContactStatus ? (
                <div>
                  <Badge variant={CONTACT_STATUS_VARIANT[student.lastContactStatus] || 'secondary'}>{student.lastContactStatus}</Badge>
                  {student.lastContactAt && (
                    <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">{formatDate(student.lastContactAt)}</div>
                  )}
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-sm font-medium">{student.leadScore ?? 0}</TableCell>
            <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(student.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
