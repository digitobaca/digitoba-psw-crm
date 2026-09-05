import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import RefundCalculatorModal from '@/features/fees/components/RefundCalculatorModal.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

export default function RefundsPage() {
  const [students, setStudents] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calcStudent, setCalcStudent] = useState(null);

  const load = () => {
    setLoading(true);
    return Promise.all([
      feesApi.fetchFeeStudents({ limit: 100 }).then((res) => setStudents(res.data)),
      feesApi.fetchFeeRefunds().then((res) => setRefunds(res.data)),
    ]).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const eligible = students.filter((s) => s.sums.clearedCents > 0);
  const refundedStudentIds = new Set(refunds.map((r) => String(r.studentId?._id || r.studentId)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refunds</h1>
        <p className="text-sm text-muted-foreground">Calculated under Ontario Regulation 415/06.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Students with fees held</h2>
        <Card className="overflow-hidden">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
          ) : eligible.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No students with confirmed fees yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Confirmed received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {eligible.map((s) => {
                    const already = refundedStudentIds.has(String(s._id)) || s.withdrawal;
                    const existingRefund = refunds.find((r) => String(r.studentId?._id || r.studentId) === String(s._id));
                    return (
                      <TableRow key={s._id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {s.name}
                          <div className="text-xs text-muted-foreground">{s.sid}</div>
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{s.programId?.name}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.clearedCents)}</TableCell>
                        <TableCell>
                          {already ? (
                            <Badge variant="warning">{existingRefund ? `${formatMoney(existingRefund.refundCents)} approved` : 'Withdrawn'}</Badge>
                          ) : (
                            <Badge variant="success">Enrolled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" disabled={!!s.withdrawal} onClick={() => setCalcStudent(s)}>
                            {already ? 'Recalculate' : 'Refund calculator'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Refund log</h2>
        {refunds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No refunds approved yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {refunds.map((r) => (
              <Card key={r._id}>
                <div className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{r.studentId?.name || r.programName}</p>
                    <Badge variant="secondary" className="capitalize">
                      {r.reason}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.programName}</p>
                  <div className="text-sm space-y-0.5 pt-1">
                    <p>
                      Retained by college: <span className="font-medium">{formatMoney(r.serviceFeeCents + r.earnedCents + r.booksCents)}</span>
                    </p>
                    <p>
                      Refund due by <span className="font-medium">{formatFeeDate(r.dueBy)}</span>: <span className="font-medium">{formatMoney(r.refundCents)}</span>
                    </p>
                    {r.clawbackCents > 0 && (
                      <p>
                        Partner clawback: <span className="font-medium">{formatMoney(r.clawbackCents)}</span>
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <RefundCalculatorModal open={!!calcStudent} onOpenChange={(o) => !o && setCalcStudent(null)} student={calcStudent} onApproved={load} />
    </div>
  );
}
