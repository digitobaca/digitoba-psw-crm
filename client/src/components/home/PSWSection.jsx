import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { ArrowRight, ClipboardCheck } from '@/components/animate-ui/icons';

const STEPS = [
  {
    step: '01',
    title: 'Eligibility Assessment',
    description: 'We review your education, experience, and language ability to confirm the fastest fit for your PSW journey.',
  },
  {
    step: '02',
    title: 'Course Enrolment',
    description: 'We match you with a recognized PSW training program at a Designated Learning Institution.',
  },
  {
    step: '03',
    title: 'Work Permit',
    description: 'Once qualified, we prepare and submit your work permit application with full documentation support.',
  },
  {
    step: '04',
    title: 'Permanent Residency',
    description: 'We guide you through provincial and federal PR pathways once you\'ve built Canadian work experience.',
  },
];

const BENEFITS = [
  { icon: '🏥', title: 'High Demand', description: 'Canada\'s aging population means consistent, nationwide demand for trained PSWs.' },
  { icon: '📜', title: 'PSW Courses', description: 'Enrol in recognized training programs designed for internationally trained caregivers.' },
  { icon: '🍁', title: 'Work Permit → PR', description: 'A clear, well-trodden route from your work permit to permanent residency.' },
  { icon: '💰', title: 'Competitive Salary', description: 'PSWs in Canada earn a competitive, stable wage with strong long-term demand.' },
];

export default function PSWSection() {
  const { openConsultation } = useConsultationModal();
  const [ctaHover, setCtaHover] = useState(false);

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">Featured Pathway</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">The PSW Pathway to Canada</h2>
          <p className="mt-4 text-gray-600">
            Personal Support Workers are among the most in-demand professionals in Canada. We built a specialized,
            end-to-end pathway to help internationally trained caregivers study, work, and settle permanently.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {BENEFITS.map((b) => (
            <Card key={b.title} className="text-center">
              <CardContent className="pt-6">
                <div className="text-4xl mb-3">{b.icon}</div>
                <h3 className="font-semibold text-gray-900">{b.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{b.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-center text-2xl font-bold text-gray-900 mb-10">Your 4-Step Journey</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, idx) => (
              <div key={s.step} className="relative">
                <div className="rounded-xl border bg-secondary/40 p-6 h-full">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold text-primary/30">{s.step}</span>
                    {idx === 0 && (
                      <ClipboardCheck size={20} className="text-primary" animateOnView animateOnViewOnce animation="check" />
                    )}
                  </div>
                  <h4 className="mt-2 font-semibold text-gray-900">{s.title}</h4>
                  <p className="mt-1.5 text-sm text-gray-600">{s.description}</p>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <Button
            size="lg"
            className="gap-2"
            onMouseEnter={() => setCtaHover(true)}
            onMouseLeave={() => setCtaHover(false)}
            onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
          >
            Start My PSW Eligibility Assessment
            <ArrowRight size={16} animate={ctaHover} />
          </Button>
          <p className="mt-3 text-sm">
            <Link to="/psw-canada" className="text-primary font-medium hover:underline">
              Learn more about the full PSW pathway →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
