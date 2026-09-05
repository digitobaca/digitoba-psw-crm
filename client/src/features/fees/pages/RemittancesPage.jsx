import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { useAuth } from '@/hooks/useAuth';
import SendRemittanceModal from '@/features/fees/components/SendRemittanceModal.jsx';
import { formatMoney, formatFeeDate } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

const STATUS_VARIANT = { pending: 'warning', reconciled: 'success' };

export default function RemittancesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isRegistrarLike = ['admin', 'registrar'].includes(user?.role);

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);
  const [confirmingRef, setConfirmingRef] = useState(null);

  const load = () => {
    setLoading(true);
    return feesApi
      .fetchFeeBatches()
      .then((res) => setBatches(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    if (user?.role === 'partner') {
      feesApi.fetchFeeStudents({ filter: 'agent', limit: 100 }).then((res) => setStudents(res.data));
    }
  }, [user?.role]);

  const handleConfirm = async (ref) => {
    setConfirmingRef(ref);
    try {
      await feesApi.confirmFeeBatch(ref);
      toast({ title: `Batch ${ref} reconciled` });
      load();
    } catch (err) {
      toast({ title: 'Could not confirm batch', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setConfirmingRef(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Remittances</h1>
          <p className="text-sm text-muted-foreground">
            {isRegistrarLike ? 'Every partner batch, across the college.' : 'Batches you have sent to the college.'}
          </p>
        </div>
        {user?.role === 'partner' && <Button onClick={() => setSendOpen(true)}>Send remittance</Button>}
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : batches.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground max-w-md mx-auto">
            No remittance batches yet. Partners create batches from the partner portal (Remittances → Send remittance) once they hold instalments
            ready to wire.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ref</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Wire reference</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  {isRegistrarLike && <TableHead>Action</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.map((b) => (
                  <TableRow key={b._id}>
                    <TableCell className="font-medium whitespace-nowrap">{b.ref}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {b.partnerId?.name}
                      <div className="text-xs text-muted-foreground">{b.partnerId?.city}</div>
                    </TableCell>
                    <TableCell className="text-sm">{b.items.length}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{b.wireRef}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatFeeDate(b.sentOn)}</TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{formatMoney(b.amountCents)}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[b.status] || 'secondary'} className="capitalize">
                        {b.status}
                      </Badge>
                    </TableCell>
                    {isRegistrarLike && (
                      <TableCell>
                        {b.status === 'pending' && (
                          <Button size="sm" disabled={confirmingRef === b.ref} onClick={() => handleConfirm(b.ref)}>
                            {confirmingRef === b.ref ? 'Confirming...' : 'Confirm batch'}
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {user?.role === 'partner' && (
        <SendRemittanceModal open={sendOpen} onOpenChange={setSendOpen} partnerId={user.partnerId} students={students} onCreated={load} />
      )}
    </div>
  );
}
