import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { formatMoney } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

export default function CommissionPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi
      .fetchFeeCommission()
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Commission</h1>
        <p className="text-sm text-muted-foreground">Accrues on confirmed instalments only — never on BJO or self-funding students.</p>
      </div>

      <Card className="overflow-hidden">
        {loading || !data ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : data.rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No partners yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Confirmed volume</TableHead>
                  <TableHead>Commission accrued</TableHead>
                  <TableHead>Refund clawback</TableHead>
                  <TableHead>Net payable</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((r) => (
                  <TableRow key={r.partner._id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {r.partner.name}
                      <div className="text-xs text-muted-foreground">{r.partner.city}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{r.partner.tier}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.partner.commissionRatePct}%</TableCell>
                    <TableCell className="text-sm">{r.studentCount}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(r.confirmedVolumeCents)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(r.accruedCents)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap text-red-600">
                      {r.clawbackCents > 0 ? `-${formatMoney(r.clawbackCents)}` : formatMoney(0)}
                    </TableCell>
                    <TableCell className="text-sm font-semibold whitespace-nowrap">{formatMoney(r.netPayableCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {data && (
        <p className="text-sm text-muted-foreground border-t pt-3">
          Total net payable to partners: <span className="font-semibold text-gray-900">{formatMoney(data.totalNetPayableCents)}</span> · accrues on
          confirmed instalments only, never on BJO or self-funding students.
        </p>
      )}
    </div>
  );
}
