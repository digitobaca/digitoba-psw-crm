import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, HeartPulse, Landmark, Users2, Globe2 } from 'lucide-react';
import { ClipboardCheck, ArrowRight } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import CTASection from '@/components/home/CTASection.jsx';

const SERVICES = [
  {
    icon: GraduationCap,
    title: 'Student Recruitment & Admissions',
    description:
      'End-to-end support choosing and applying to Canadian colleges and universities that fit your budget, program interests, and post-graduation work permit eligibility.',
  },
  {
    icon: HeartPulse,
    title: 'PSW Pathway to Canada',
    description:
      'Our flagship program for internationally trained caregivers: eligibility assessment, PSW course enrolment, work permit application, and PR guidance.',
  },
  {
    icon: ClipboardCheck,
    title: 'Study Permit Applications',
    description:
      'Complete preparation and submission of your study permit file, including statement of purpose review and proof-of-funds documentation.',
    animated: true,
  },
  {
    icon: Landmark,
    title: 'Permanent Residency Pathways',
    description:
      'Guidance through Express Entry, Provincial Nominee Programs, and other PR routes once you have Canadian study or work experience.',
  },
  {
    icon: Users2,
    title: 'Family Sponsorship',
    description:
      'Support for spouses and dependents accompanying you to Canada, including open work and study permit options.',
  },
  {
    icon: Globe2,
    title: 'Post-Landing Support',
    description:
      'We stay with you after you land — settlement guidance, employer connections, and ongoing immigration advice.',
  },
];

export default function ServicesPage() {
  const { openConsultation } = useConsultationModal();
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Our Services</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Comprehensive support across every stage of your Canadian study, work, and immigration journey.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(({ icon: Icon, title, description, animated }) => (
            <div key={title} className="rounded-xl border bg-white p-7 shadow-sm flex flex-col">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                {animated ? (
                  <Icon size={24} className="text-primary" animateOnView animateOnViewOnce animation="check" />
                ) : (
                  <Icon className="h-6 w-6 text-primary" />
                )}
              </div>
              <h3 className="mt-4 font-semibold text-lg text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600 flex-1">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <Button
            size="lg"
            className="gap-2"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            onClick={() => openConsultation()}
          >
            Book Your Free Consultation
            <ArrowRight size={16} animate={ctaHover} />
          </Button>
          <p className="mt-3 text-sm">
            <Link to="/psw-canada" className="text-primary font-medium hover:underline">
              See the full PSW pathway details →
            </Link>
          </p>
        </div>
      </section>

      <CTASection />
    </>
  );
}
