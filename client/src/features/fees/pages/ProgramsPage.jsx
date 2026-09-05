import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatMoney } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

export default function ProgramsPage() {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi
      .fetchFeePrograms()
      .then((res) => setPrograms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Programs</h1>
        <p className="text-sm text-muted-foreground">Fee structures and instalment templates from the college fact sheets.</p>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : programs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No programs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Total fee</TableHead>
                  <TableHead>Self-funding</TableHead>
                  <TableHead>Int'l fee</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map((p) => (
                  <TableRow key={p._id} className="cursor-pointer" onClick={() => navigate(`/fees/programs/${p._id}`)}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {p.name}
                      <div className="text-xs text-muted-foreground">NOC {p.nocCode}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.type}</Badge>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{p.durationShort}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.totalCents)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.selfFundingCents)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.totalCents + (p.intlSurchargeCents || 0))}</TableCell>
                    <TableCell className="text-sm">{p.enrolledCount ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
