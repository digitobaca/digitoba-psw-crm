import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Twitter, Mail } from 'lucide-react';
import { PhoneCall, MapPin } from '@/components/animate-ui/icons';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { submitLead } from '@/lib/api';

const FOOTER_LINKS = [
  {
    heading: 'Company',
    links: [
      { to: '/about', label: 'About Us' },
      { to: '/services', label: 'Services' },
      { to: '/success-stories', label: 'Success Stories' },
      { to: '/blog', label: 'Blog' },
      { to: '/contact', label: 'Contact' },
    ],
  },
  {
    heading: 'Study in Canada',
    links: [
      { to: '/psw-canada', label: 'PSW Canada Pathway' },
      { to: '/programs', label: 'Programs' },
      { to: '/colleges', label: 'Colleges' },
      { to: '/admission-process', label: 'Admission Process' },
      { to: '/eligibility-checker', label: 'Eligibility Checker' },
      { to: '/cost-calculator', label: 'Cost Calculator' },
    ],
  },
];

function NewsletterForm() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      await submitLead({
        name: 'Newsletter Subscriber',
        email,
        phone: 'N/A',
        intendedProgram: 'Newsletter',
        leadSource: 'newsletter',
      });
      toast({ title: 'Subscribed!', description: "You'll hear from us with updates and tips." });
      setEmail('');
    } catch (err) {
      toast({
        title: 'Could not subscribe',
        description: err.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3">
      <Input
        type="email"
        required
        placeholder="Your email address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
      />
      <Button type="submit" variant="secondary" disabled={submitting} className="shrink-0">
        {submitting ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </form>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container py-14 grid gap-10 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">CD</span>
            <span>
              Canada<span className="text-red-500">Digitoba</span>
            </span>
          </Link>
          <p className="mt-3 text-sm text-gray-400 max-w-xs">
            Your trusted partner for studying, working, and immigrating to Canada — with a dedicated pathway for
            internationally trained Personal Support Workers.
          </p>
          <div className="flex gap-3 mt-4">
            <a href="#" aria-label="Facebook" className="text-gray-400 hover:text-white"><Facebook className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="text-gray-400 hover:text-white"><Instagram className="h-5 w-5" /></a>
            <a href="#" aria-label="LinkedIn" className="text-gray-400 hover:text-white"><Linkedin className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="text-gray-400 hover:text-white"><Twitter className="h-5 w-5" /></a>
          </div>
        </div>

        {FOOTER_LINKS.map((col) => (
          <div key={col.heading}>
            <h4 className="text-white font-semibold mb-3">{col.heading}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-white font-semibold mb-3">Get in Touch</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" /> admissions@canadadigitoba.com
            </li>
            <li className="flex items-center gap-2">
              <PhoneCall size={16} className="shrink-0" animateOnView animateOnViewOnce /> +1 (204) 000-0000
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={16} className="shrink-0" animateOnView animateOnViewOnce delay={150} /> Winnipeg, Manitoba, Canada
            </li>
          </ul>
          <h4 className="text-white font-semibold mt-5 mb-1 text-sm">Subscribe to our Newsletter</h4>
          <NewsletterForm />
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
          <p>&copy; {year} CanadaDigitoba. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/delete-my-info" className="hover:text-white transition-colors">
              Delete My Info
            </Link>
            <p>Regulated Canadian Immigration Consulting (RCIC) partnered services.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
