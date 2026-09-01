import { useEffect, useState } from 'react';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatDate } from '@/lib/utils';
import * as api from '@/lib/api';

const STATUS_VARIANT = { Pending: 'warning', Paid: 'success', Refunded: 'secondary', Failed: 'destructive' };

export default function PortalPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchPortalPayments()
      .then((res) => setPayments(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-muted-foreground">Application fees, tuition deposits, and service fees.</p>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium">{p.type}</TableCell>
                  <TableCell>
                    {p.amount.toLocaleString()} {p.currency}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.dueDate ? formatDate(p.dueDate) : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[p.status] || 'secondary'}>{p.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Online payment isn&apos;t enabled yet — your counsellor will share payment instructions directly for anything marked Pending.
      </p>
    </div>
  );
}
