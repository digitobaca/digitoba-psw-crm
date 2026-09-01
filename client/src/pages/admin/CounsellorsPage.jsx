import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

/** Admin-only: create counsellor accounts and see each one's current caseload. */
export default function CounsellorsPage() {
  const { toast } = useToast();
  const [counsellors, setCounsellors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .fetchCounsellors()
      .then((res) => setCounsellors(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.createCounsellor(form);
      toast({ title: 'Counsellor created' });
      setForm({ name: '', email: '', phone: '', password: '' });
      load();
    } catch (err) {
      toast({ title: 'Could not create counsellor', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (counsellor) => {
    const res = await api.updateCounsellor(counsellor._id, { isActive: !counsellor.isActive });
    setCounsellors((prev) => prev.map((c) => (c._id === counsellor._id ? res.data : c)));
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Counsellors</h1>
        <p className="text-sm text-muted-foreground mb-6">{counsellors.length} team member(s)</p>

        <div className="rounded-xl border bg-white overflow-hidden">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Active Students</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {counsellors.map((c) => (
                  <TableRow key={c._id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm">{c.email}</TableCell>
                    <TableCell className="text-sm">{c.activeStudentCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={c.isActive ? 'success' : 'secondary'}
                        className="cursor-pointer"
                        onClick={() => toggleActive(c)}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">New Counsellor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-name">Name</Label>
              <Input id="c-name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-phone">Phone</Label>
              <Input id="c-phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-password">Temporary Password</Label>
              <Input
                id="c-password"
                type="text"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Creating...' : 'Create Counsellor'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
