import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { submitLead } from '@/lib/api';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { Send } from '@/components/animate-ui/icons';

const PROGRAM_OPTIONS = [
  'PSW Pathway to Canada',
  'Study Permit / College Program',
  'Study Permit / University Program',
  "Master's / MBA in Canada",
  'Permanent Residency Pathway',
  'Not sure yet',
];

const STATUS_OPTIONS = ['Work Permit', 'Study Permit', 'PR / Citizen', 'Refugee Claimant'];

const REDIRECT_DELAY_MS = 2500;

/**
 * The single lead-capture form used everywhere on the site: the header/hero
 * "Book Your Free Consultation" modal, the Contact page, and the Free
 * Assessment page. `defaults` lets a caller pre-select a program and tag the
 * lead source; `redirectTo` (used only by the auto-popup modal) sends the
 * visitor on to another page a couple seconds after a successful submit.
 */
export default function ConsultationForm({ defaults = {}, onSuccess, compact = false, redirectTo = null }) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [submitHover, setSubmitHover] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: '',
    immigrationStatus: '',
    intendedProgram: defaults.intendedProgram || '',
    message: '',
  });

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  // `onSuccess` (the modal's close handler) fires here rather than the
  // moment the request succeeds — otherwise the modal would close itself
  // before the visitor ever sees the success panel or the WhatsApp button.
  // With a redirectTo, it fires right alongside navigating away; without
  // one, there's no delay to wait for.
  useEffect(() => {
    if (!submitted) return;
    if (redirectTo) {
      const t = setTimeout(() => {
        onSuccess?.();
        navigate(redirectTo);
      }, REDIRECT_DELAY_MS);
      return () => clearTimeout(t);
    }
    onSuccess?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted]);

  // Country/Status/Program render as Radix Selects, not native <select>
  // elements, so the browser's built-in `required` validation (which the
  // Name/Email/Phone inputs rely on) doesn't reach them — enforce it here
  // instead. Message stays optional (freeform "anything else"), and is
  // skipped entirely in compact mode since it isn't even rendered there.
  const validate = () => {
    if (!form.country.trim()) return 'Please enter your country of residence.';
    if (!form.immigrationStatus) return 'Please select your current status.';
    if (!form.intendedProgram) return 'Please select an intended program.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      toast({ title: 'Missing information', description: validationError, variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await submitLead({ ...form, leadSource: defaults.leadSource || 'consultation_form' });
      toast({
        title: 'Successfully submitted!',
        description: "We're contacting you shortly.",
      });
      setLeadName(form.name);
      setSubmitted(true);
      setForm({ name: '', email: '', phone: '', country: '', immigrationStatus: '', intendedProgram: '', message: '' });
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

  if (submitted) {
    const whatsappHref = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
          `Hi CanadaDigitoba, I'm ${leadName || 'a new lead'} — I just submitted a consultation request and wanted to reach out directly.`
        )}`
      : null;

    return (
      <div className="space-y-4 py-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl">
          ✓
        </div>
        <div>
          <p className="font-semibold text-gray-900">Successfully submitted!</p>
          <p className="text-sm text-muted-foreground mt-1">
            We're contacting you shortly{redirectTo && <> — taking you to our PSW page now...</>}
          </p>
        </div>
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="block">
            <Button type="button" variant="outline" className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
              Message us on WhatsApp now →
            </Button>
          </a>
        )}
        <p className="text-xs text-muted-foreground">Don't want to wait? Reach out on WhatsApp directly, no queue.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" required value={form.name} onChange={update('name')} placeholder="Jane Doe" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required value={form.email} onChange={update('email')} placeholder="jane@example.com" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" required value={form.phone} onChange={update('phone')} placeholder="+1 000 000 0000" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">Country of Residence</Label>
          <Input id="country" required value={form.country} onChange={update('country')} placeholder="Canada" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="status">Current Status</Label>
          <Select value={form.immigrationStatus} onValueChange={(v) => setForm((f) => ({ ...f, immigrationStatus: v }))}>
            <SelectTrigger id="status" aria-required="true">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="program">Intended Program</Label>
          <Select value={form.intendedProgram} onValueChange={(v) => setForm((f) => ({ ...f, intendedProgram: v }))}>
            <SelectTrigger id="program" aria-required="true">
              <SelectValue placeholder="Select a pathway" />
            </SelectTrigger>
            <SelectContent>
              {PROGRAM_OPTIONS.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {!compact && (
        <div className="space-y-1.5">
          <Label htmlFor="message">Anything else we should know? (optional)</Label>
          <Textarea id="message" value={form.message} onChange={update('message')} placeholder="Tell us about your goals..." />
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2"
        disabled={submitting}
        onMouseEnter={() => setSubmitHover(true)}
        onMouseLeave={() => setSubmitHover(false)}
      >
        {submitting ? 'Submitting...' : 'Book Your Free Consultation'}
        {!submitting && <Send size={16} animate={submitHover} />}
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        By submitting, you agree to be contacted by CanadaDigitoba about your inquiry. We never share your data with third parties.
      </p>
    </form>
  );
}
