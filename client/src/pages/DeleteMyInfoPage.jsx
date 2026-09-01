import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { submitDeletionRequest } from '@/lib/api';

/**
 * Public data-deletion-request page. Deliberately lightweight: submitting
 * doesn't auto-delete anything (a name/email alone isn't a safe basis to
 * wipe a CRM record automatically) — it notifies the team, who verify the
 * requester and process it by hand. That's disclosed on the page itself
 * rather than implied.
 */
export default function DeleteMyInfoPage() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitDeletionRequest(form);
      setSubmitted(true);
      toast({ title: 'Request received', description: "We'll process it and follow up if needed." });
    } catch (err) {
      toast({
        title: 'Something went wrong',
        description: err.response?.data?.message || 'Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Delete My Info</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Request that CanadaDigitoba delete the personal information we hold about you.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-2xl grid gap-8">
          <div className="text-sm text-gray-600 space-y-3">
            <p>
              If you've previously submitted an inquiry, consultation request, or created a student portal account
              with us, you can ask us to delete that information. To protect your data, we verify every request
              before acting on it — submitting this form doesn't delete anything automatically, it lets our team
              know to review and process your request.
            </p>
            <p>
              We may need to keep certain records for a limited period where required by law or an active
              application. We'll let you know if that applies to your request.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{submitted ? 'Request Received' : 'Submit a Deletion Request'}</CardTitle>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="space-y-3 py-2 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
                    ✓
                  </div>
                  <p className="font-semibold text-gray-900">Your request has been received.</p>
                  <p className="text-sm text-muted-foreground">
                    Our team will verify and process it, and will reach out if we need anything else from you.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="dmi-name">Full Name</Label>
                      <Input id="dmi-name" required value={form.name} onChange={update('name')} placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="dmi-email">Email used with us</Label>
                      <Input
                        id="dmi-email"
                        type="email"
                        required
                        value={form.email}
                        onChange={update('email')}
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dmi-phone">Phone (optional, helps us find your record)</Label>
                    <Input id="dmi-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 000 000 0000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dmi-reason">Reason (optional)</Label>
                    <Textarea id="dmi-reason" value={form.reason} onChange={update('reason')} placeholder="Let us know if there's anything specific..." />
                  </div>
                  <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Deletion Request'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
