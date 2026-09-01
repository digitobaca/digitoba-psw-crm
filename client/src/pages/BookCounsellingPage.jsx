import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { Send } from '@/components/animate-ui/icons';
import { submitLead } from '@/lib/api';

/**
 * A simple "request a callback at a preferred time" form. Real calendar
 * booking (Calendly-style time slots) needs a scheduling provider, which
 * isn't wired in yet — a counsellor confirms the actual time by phone/email
 * after this request comes in.
 */
export default function BookCounsellingPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', preferredDate: '', preferredTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        leadSource: 'website',
        intendedProgram: 'Counselling Call Requested',
        message: `Requested counselling call — preferred date: ${form.preferredDate || 'any'}, preferred time: ${form.preferredTime || 'any'}.`,
      });
      setSubmitted(true);
      toast({ title: 'Request received!', description: 'A counsellor will confirm your call time shortly.' });
    } catch (err) {
      toast({ title: 'Something went wrong', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Book Counselling</h1>
          <p className="mt-4 text-gray-600">Tell us when works best — a counsellor will confirm your call.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request a Call</CardTitle>
            <CardDescription>We will confirm the exact time by email or WhatsApp.</CardDescription>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <p className="text-sm text-center text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                Thanks! We&apos;ve received your request and will confirm a time within 1-2 business days.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bc-name">Full Name</Label>
                  <Input id="bc-name" required value={form.name} onChange={update('name')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bc-email">Email</Label>
                    <Input id="bc-email" type="email" required value={form.email} onChange={update('email')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bc-phone">Phone</Label>
                    <Input id="bc-phone" type="tel" required value={form.phone} onChange={update('phone')} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="bc-date">Preferred Date</Label>
                    <Input id="bc-date" type="date" value={form.preferredDate} onChange={update('preferredDate')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bc-time">Preferred Time</Label>
                    <Input id="bc-time" type="time" value={form.preferredTime} onChange={update('preferredTime')} />
                  </div>
                </div>
                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Request Call'}
                  {!submitting && <Send size={16} />}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
