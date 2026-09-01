import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

/**
 * Covers the core scalar profile fields a student can self-serve. Richer
 * structured data (multiple education entries, full test-score breakdowns,
 * detailed work history) is entered by the counsellor via the admin CRM for
 * now — a fuller repeating-section editor here is a natural next iteration.
 */
export default function PortalProfilePage() {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.fetchPortalProfile().then((res) => {
      const p = res.data;
      setForm({
        city: p.city || '',
        country: p.country || '',
        address: p.address || '',
        careerGoal: p.careerGoal || '',
        preferredProvince: p.preferredProvince || '',
        budgetAmount: p.financialProfile?.budgetAmount || '',
        ieltsOverall: p.testScores?.ielts?.overall || '',
      });
    });
  }, []);

  if (!form) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePortalProfile({
        city: form.city,
        country: form.country,
        address: form.address,
        careerGoal: form.careerGoal,
        preferredProvince: form.preferredProvince,
        financialProfile: { budgetAmount: form.budgetAmount ? Number(form.budgetAmount) : undefined, budgetCurrency: 'CAD' },
        testScores: { ielts: { overall: form.ieltsOverall ? Number(form.ieltsOverall) : undefined } },
      });
      toast({ title: 'Profile updated' });
    } catch (err) {
      toast({ title: 'Could not save', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Your Profile</CardTitle>
        <CardDescription>Completing this helps your counsellor find the right programs for you.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={update('city')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={form.country} onChange={update('country')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={form.address} onChange={update('address')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="careerGoal">Career Goal</Label>
            <Input id="careerGoal" value={form.careerGoal} onChange={update('careerGoal')} placeholder="e.g. Work as a Business Analyst in Ontario" />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="preferredProvince">Preferred Province</Label>
              <Input id="preferredProvince" value={form.preferredProvince} onChange={update('preferredProvince')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="budgetAmount">Budget (CAD)</Label>
              <Input id="budgetAmount" type="number" value={form.budgetAmount} onChange={update('budgetAmount')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ieltsOverall">IELTS Overall</Label>
              <Input id="ieltsOverall" type="number" step="0.5" value={form.ieltsOverall} onChange={update('ieltsOverall')} />
            </div>
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
