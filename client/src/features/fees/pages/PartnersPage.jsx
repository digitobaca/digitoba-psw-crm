import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatMoney } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

export default function PartnersPage() {
  const navigate = useNavigate();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi
      .fetchFeePartners()
      .then((res) => setPartners(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment partners</h1>
        <p className="text-sm text-muted-foreground">{partners.length} partner{partners.length === 1 ? '' : 's'} — commission accrues on cleared intl instalments only.</p>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : partners.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No partners yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Collected</TableHead>
                  <TableHead>Held / not remitted</TableHead>
                  <TableHead>Remitted</TableHead>
                  <TableHead>Commission accrued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partners.map((p) => (
                  <TableRow key={p._id} className="cursor-pointer" onClick={() => navigate(`/fees/partners/${p._id}`)}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {p.name}
                      <div className="text-xs text-muted-foreground">
                        {p.city}
                        {p.phone ? ` · ${p.phone}` : ''}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{p.tier}</Badge> <span className="text-xs text-muted-foreground">{p.commissionRatePct}%</span>
                    </TableCell>
                    <TableCell className="text-sm">{p.commission?.studentCount ?? 0}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.commission?.confirmedVolumeCents)}</TableCell>
                    <TableCell className={`text-sm whitespace-nowrap ${p.commission?.late ? 'text-red-600 font-semibold' : ''}`}>
                      {formatMoney(p.commission?.heldCents)} {p.commission?.heldCents > 0 && `(${p.commission.oldestHeldDays}d)`}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.commission?.confirmedVolumeCents)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(p.commission?.accruedCents)}</TableCell>
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
