import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { ArrowRight } from '@/components/animate-ui/icons';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const STATS = [
  { value: '90%+', label: 'Employment Rate for Graduates' },
  { value: '100,000+', label: 'PSW Positions Needed Within 5 Years' },
  { value: '200+', label: 'Healthcare Facilities in Our Network' },
];

const SECTORS = [
  {
    title: 'Long-Term Care (LTC) Facilities',
    openings: '35,000+',
    salary: '$22–$30/hr',
    description: 'The largest employer of PSWs in Canada. Residents need 24/7 personal support.',
    benefits: 'Stable full-time hours, unionized positions, benefits and pension plans',
  },
  {
    title: 'Hospitals & Rehabilitation Centres',
    openings: '15,000+',
    salary: '$24–$32/hr',
    description: 'PSWs work alongside nurses in acute care, surgical recovery, and rehab wards.',
    benefits: 'Highest salaries, advanced clinical exposure, strong union protections',
  },
  {
    title: 'Home & Community Care',
    openings: '25,000+',
    salary: '$30–$38/hr',
    description: 'One-on-one client care in their own homes. Flexible scheduling, growing demand as Canada ages in place.',
    benefits: 'Flexible scheduling, one-on-one care model, mileage reimbursement',
  },
  {
    title: 'Retirement Residences',
    openings: '12,000+',
    salary: '$21–$27/hr',
    description: 'Privately operated retirement communities offer competitive wages, pleasant environments, and a growing client base.',
    benefits: 'Positive work environment, career growth opportunities, regular hours',
  },
  {
    title: 'Developmental Services',
    openings: '8,000+',
    salary: '$22–$29/hr',
    description: 'Support individuals with developmental disabilities in group homes and day programs.',
    benefits: 'Meaningful specialized work, community integration focus, government-funded roles',
  },
  {
    title: 'Indigenous & Remote Community Care',
    openings: '5,000+',
    salary: '$28–$38/hr',
    description: 'PSWs working in remote and Indigenous communities receive higher wages plus subsidized housing.',
    benefits: 'Premium pay rates, housing often included, strong PR point boost',
  },
];

const EMPLOYERS = [
  'SE Health (formerly Saint Elizabeth)',
  'Bayshore Home Health',
  'CarePartners',
  'Revera Long Term Care',
  'Extendicare',
  'Ontario Health (Home & Community Care)',
  'Vancouver Coastal Health',
  'Alberta Health Services',
];

const PROCESS = [
  { step: '01', title: 'Résumé & Portfolio Prep', description: 'Our experts help you craft a PSW-specific résumé highlighting your practicum, certifications, and soft skills that Canadian employers value.' },
  { step: '02', title: 'Job Matching & Referrals', description: 'We connect you directly with our employer network — over 200 healthcare facilities across Canada actively looking for PSW graduates.' },
  { step: '03', title: 'Interview Coaching', description: 'Prepare for common PSW interview questions, scenario-based responses, and professional presentation to land the role.' },
  { step: '04', title: 'Offer & Onboarding Support', description: 'We support you through job offer review, salary negotiation, and the onboarding process so you start your career on the right foot.' },
];

export default function PSWPlacementsPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">PSW Placements</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-gray-900">
            PSW Job Placements in Canada — Start Working in Healthcare
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Canada needs over 100,000 new PSWs in the next five years. Our placement network connects you to top
            healthcare employers right after you complete your PSW certification.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-primary">{s.value}</p>
                <p className="mt-1 text-xs text-gray-600">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Employment Sectors &amp; Opportunities</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {SECTORS.map((s) => (
              <Card key={s.title}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-gray-900">{s.title}</h3>
                    <span className="shrink-0 text-xs font-semibold text-primary bg-accent rounded-full px-2.5 py-1">
                      {s.openings}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">{s.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>💰 {s.salary}</span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{s.benefits}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Top Employers in Our Network</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {EMPLOYERS.map((e) => (
              <span key={e} className="rounded-full border bg-white px-4 py-2 text-sm text-gray-700">
                {e}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Our Placement Process</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((s) => (
              <div key={s.step} className="rounded-xl border bg-secondary/30 p-6">
                <span className="text-3xl font-extrabold text-primary/30">{s.step}</span>
                <h4 className="mt-2 font-semibold text-gray-900">{s.title}</h4>
                <p className="mt-1.5 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button
              size="lg"
              className="gap-2"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
            >
              Book Your Free Counselling Session
              <ArrowRight size={16} animate={hover} />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
