import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import PlanSegmentBar from '@/features/fees/components/PlanSegmentBar.jsx';
import { formatMoney } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

function Stat({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function PartnerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi
      .fetchFeePartner(id)
      .then((res) => setPartner(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (!partner) return <p className="py-10 text-center text-sm text-destructive">Partner not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate('/fees/partners')}>
        ← Back to partners
      </Button>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{partner.name}</h1>
          <Badge variant="secondary">{partner.tier}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {partner.city}, {partner.country} · {partner.commissionRatePct}% commission · remit within {partner.remitWindowDays} days
          {partner.phone && (
            <>
              {' · '}
              <a className="text-primary hover:underline" href={`tel:${partner.phone}`}>
                {partner.phone}
              </a>
            </>
          )}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Confirmed into college" value={formatMoney(partner.commission?.confirmedVolumeCents)} />
        <Stat label="Held, not remitted" value={formatMoney(partner.commission?.heldCents)} />
        <Stat label="Commission accrued" value={formatMoney(partner.commission?.accruedCents)} />
        <Stat label="Net payable" value={formatMoney(partner.commission?.netPayableCents)} />
      </div>
      {partner.commission?.late && (
        <p className="text-sm text-red-600 font-medium">
          Holding cash for {partner.commission.oldestHeldDays} days — past the {partner.remitWindowDays}-day remit window.
        </p>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Students ({partner.students?.length ?? 0})</h2>
        <Card className="overflow-hidden">
          {(partner.students || []).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No students yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead className="min-w-[160px]">Fee plan</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Cleared</TableHead>
                    <TableHead>Held</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partner.students.map((s) => (
                    <TableRow key={s._id} className="cursor-pointer" onClick={() => navigate(`/fees/students/${s._id}`)}>
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.name}
                        <div className="text-xs text-muted-foreground">{s.sid}</div>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{s.programId?.name}</TableCell>
                      <TableCell>
                        <PlanSegmentBar instalments={s.instalments} />
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.totalCents)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.clearedCents)}</TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{formatMoney(s.sums.heldCents)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
