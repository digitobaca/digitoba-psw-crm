import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { ArrowRight } from '@/components/animate-ui/icons';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const PROVINCES = [
  {
    province: 'Ontario',
    duration: '25 weeks',
    fees: '$3,000 – $8,000',
    hours: '740 hrs (440 theory + 300 practical)',
    notes: 'NACC-accredited. Largest PSW employer market in Canada.',
  },
  {
    province: 'British Columbia',
    duration: '7–8 months',
    fees: '$4,000 – $9,000',
    hours: '400+ hrs',
    notes: 'Called Health Care Assistant (HCA) — fully transferable.',
  },
  {
    province: 'Alberta',
    duration: '6–12 months',
    fees: '$3,500 – $7,500',
    hours: '300+ hrs',
    notes: 'High demand due to oil-sector boom & aging population.',
  },
  {
    province: 'Manitoba',
    duration: '8–10 months',
    fees: '$2,500 – $6,000',
    hours: '350+ hrs',
    notes: 'Provincial Nominee Program actively recruits PSWs.',
  },
  {
    province: 'Nova Scotia',
    duration: '6–9 months',
    fees: '$3,000 – $6,500',
    hours: '300+ hrs',
    notes: 'Atlantic Immigration Pilot available for PSW workers.',
  },
];

const CURRICULUM = [
  { module: 'PSW Foundations', hours: 55 },
  { module: 'Safety and Mobility', hours: 40 },
  { module: 'Body Systems', hours: 40 },
  { module: 'Personal Hygiene Assistance', hours: 30 },
  { module: 'Abuse and Neglect Recognition', hours: 15 },
  { module: 'Household Management and Nutrition', hours: 25 },
  { module: 'Care Planning', hours: 30 },
  { module: 'Family Support', hours: 25 },
  { module: 'End-of-Life Care', hours: 30 },
  { module: 'Medication Assistance', hours: 20 },
  { module: 'Cognitive and Mental Health', hours: 40 },
  { module: 'Health Conditions', hours: 40 },
  { module: 'Dementia Care Techniques', hours: 10 },
];

const APPLICATION_STEPS = [
  { step: '01', title: 'Choose Your Province', description: 'We help you compare programs across Ontario, BC, Alberta, Manitoba, and Nova Scotia to find the best fit for your budget and timeline.' },
  { step: '02', title: 'Meet Admission Requirements', description: 'A Grade 12 diploma (or equivalent), a clear criminal background check, and up-to-date immunization records.' },
  { step: '03', title: 'Complete Coursework & Certification', description: 'Finish your theory and practicum hours, graduate, and we help line up your first placement.' },
];

export default function PSWCoursesPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">PSW Courses</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-gray-900">
            PSW Courses in Canada — Find the Right Program for You
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Compare government-approved Personal Support Worker programs across all provinces.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Compare Programs by Province</h2>
          <div className="rounded-xl border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Province</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Fees (CAD)</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {PROVINCES.map((p) => (
                  <TableRow key={p.province}>
                    <TableCell className="font-medium">{p.province}</TableCell>
                    <TableCell className="text-sm">{p.duration}</TableCell>
                    <TableCell className="text-sm">{p.fees}</TableCell>
                    <TableCell className="text-sm">{p.hours}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Figures are general planning estimates — see verified, institution-specific tuition and intakes on our{' '}
            <Link to="/programs" className="text-primary underline">Programs</Link> page, or ask your counsellor.
          </p>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">What You'll Learn — 14 Core Modules</h2>
          <p className="text-gray-600 mb-8">Every accredited PSW program covers these core topics.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CURRICULUM.map((c) => (
              <div key={c.module} className="rounded-lg border bg-white p-4 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">{c.module}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">{c.hours} hrs</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">The Application Process</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {APPLICATION_STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border bg-secondary/30 p-6">
                <span className="text-3xl font-extrabold text-primary/30">{s.step}</span>
                <h3 className="mt-2 font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
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
