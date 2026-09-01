import { useState } from 'react';
import { ArrowRight, ClipboardCheck } from '@/components/animate-ui/icons';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import CTASection from '@/components/home/CTASection.jsx';

const STEPS = [
  { step: '01', title: 'Free Eligibility Assessment', description: 'Share your education, test scores, and goals — we tell you honestly where you stand.' },
  { step: '02', title: 'Program & College Shortlist', description: 'Your counsellor recommends verified programs that fit your budget, marks, and career goals.' },
  { step: '03', title: 'Document Preparation', description: 'We help you gather and prepare transcripts, SOP, financial documents, and test scores.' },
  { step: '04', title: 'Application Submission', description: 'Your counsellor submits applications and tracks each one until a decision arrives.' },
  { step: '05', title: 'Offer & Deposit', description: 'Once you accept an offer, we guide you through the tuition deposit and LOA process.' },
  { step: '06', title: 'Study Permit (Visa) Filing', description: 'Complete study permit application support, filed with your LOA and financial proof.' },
  { step: '07', title: 'Pre-Departure & Enrolment', description: 'A pre-departure checklist, settlement guidance, and support until you are enrolled in Canada.' },
];

export default function AdmissionProcessPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">The Canada Admission Process</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Seven clear stages from your first assessment to enrolling in Canada.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <ol className="space-y-6">
            {STEPS.map((s) => (
              <li key={s.step} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{s.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 rounded-2xl border bg-secondary/30 p-8 text-center">
            <ClipboardCheck size={32} className="text-primary mx-auto" animateOnView animateOnViewOnce animation="check" />
            <h3 className="mt-3 font-semibold text-lg text-gray-900">Ready to start Step 1?</h3>
            <p className="mt-1 text-sm text-gray-600">Your free eligibility assessment takes less than 5 minutes.</p>
            <Button
              className="mt-5 gap-2"
              onMouseEnter={() => setHover(true)}
              onMouseLeave={() => setHover(false)}
              onClick={() => openConsultation({ leadSource: 'website' })}
            >
              Check My Eligibility
              <ArrowRight size={16} animate={hover} />
            </Button>
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
