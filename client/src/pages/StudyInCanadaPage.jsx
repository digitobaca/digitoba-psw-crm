import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Landmark, FileCheck2, Users2 } from 'lucide-react';
import { ArrowRight } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import Testimonials from '@/components/home/Testimonials.jsx';
import CTASection from '@/components/home/CTASection.jsx';

const HIGHLIGHTS = [
  { icon: GraduationCap, title: 'Top Canadian Institutions', description: 'Diploma, Bachelor’s, and Master’s programs at verified, Designated Learning Institutions.' },
  { icon: FileCheck2, title: 'Study Permit Support', description: 'Complete document preparation and application filing, handled by experienced counsellors.' },
  { icon: Landmark, title: 'Post-Graduation Pathway', description: 'Programs chosen for PGWP eligibility and a realistic route toward permanent residency.' },
  { icon: Users2, title: 'Dedicated Counsellor', description: 'One counsellor assigned to you from your first consultation through enrolment and beyond.' },
];

export default function StudyInCanadaPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-gradient-to-b from-red-50 via-white to-white py-20 md:py-28 text-center">
        <div className="container">
          <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 mb-5">
            Study in Canada
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto">
            Your Path to Studying &amp; Building a Life in Canada
          </h1>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            From choosing the right program to landing at your Canadian campus — free eligibility assessment,
            verified college database, and one dedicated counsellor guiding every step.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => openConsultation({ leadSource: 'website' })}
            >
              Check My Eligibility
              <ArrowRight size={16} animate={hover} />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/colleges">Browse Colleges</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="rounded-xl border p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center mx-auto">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-center">
          {[
            { to: '/programs', label: 'Browse Programs' },
            { to: '/colleges', label: 'Browse Colleges' },
            { to: '/eligibility-checker', label: 'Eligibility Checker' },
            { to: '/cost-calculator', label: 'Cost Calculator' },
          ].map((link) => (
            <Link key={link.to} to={link.to} className="rounded-xl border bg-white p-6 font-medium text-gray-900 hover:border-primary hover:text-primary transition-colors">
              {link.label} →
            </Link>
          ))}
        </div>
      </section>

      <Testimonials />
      <CTASection />
    </>
  );
}
