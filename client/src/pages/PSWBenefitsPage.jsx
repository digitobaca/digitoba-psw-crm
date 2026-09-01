import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { ArrowRight, CircleCheck } from '@/components/animate-ui/icons';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const BENEFITS = [
  { title: 'Competitive & Growing Salary', description: 'PSW compensation increased 18% since 2020, with Ontario setting rates at $24/hr as of 2024.' },
  { title: 'Comprehensive Healthcare Benefits', description: 'Most positions include extended health, dental, and vision coverage.' },
  { title: 'Flexible Shift Options', description: 'Availability across day, evening, night, and weekend schedules in various care settings.' },
  { title: 'Career Advancement Path', description: 'Opportunities to progress toward RPN, RN, or healthcare management roles.' },
  { title: 'Immigration Advantage', description: 'Work experience qualifies for Express Entry points and dedicated PR streams.' },
  { title: 'Work Across All Settings', description: 'Employment options span long-term care, retirement residences, hospitals, and private home care.' },
  { title: 'Government-Funded Training', description: 'Several provinces offer free or subsidized programs for eligible applicants.' },
  { title: 'Union Protections Available', description: 'Many positions include unionized protections for wages and scheduling.' },
];

const SALARY_TABLE = [
  { province: 'Ontario', entry: '$50,000', mid: '$65,000', senior: '$72,000' },
  { province: 'British Columbia', entry: '$40,000', mid: '$53,000', senior: '$65,000' },
  { province: 'Alberta', entry: '$42,000', mid: '$55,000', senior: '$68,000' },
  { province: 'Manitoba', entry: '$35,000', mid: '$46,000', senior: '$58,000' },
  { province: 'Nova Scotia', entry: '$33,000', mid: '$44,000', senior: '$55,000' },
];

const CAREER_PATH = [
  { stage: 'PSW Student', timing: '6–12 months' },
  { stage: 'Certified PSW', timing: 'Entry-level' },
  { stage: 'Senior PSW / Lead', timing: '3–5 years' },
  { stage: 'RPN / Healthcare Manager', timing: 'via bridging program' },
];

export default function PSWBenefitsPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">PSW Benefits</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-gray-900">
            PSW Benefits in Canada — Salary, Security &amp; a Path to PR
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Becoming a PSW is one of the smartest career moves in Canada — thousands pursue this route as their entry
            into Canadian Permanent Residence.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">8 Key Benefits of the PSW Career Path</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {BENEFITS.map((b, i) => (
              <div key={b.title} className="rounded-xl border bg-secondary/30 p-5 flex gap-3">
                <CircleCheck size={22} className="text-primary shrink-0 mt-0.5" animateOnView animateOnViewOnce delay={i * 80} />
                <div>
                  <h3 className="font-semibold text-gray-900">{b.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salary by Province (2024–2025)</h2>
          <p className="text-gray-600 mb-6">Planning estimates — actual pay varies by employer and setting.</p>
          <div className="rounded-xl border overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Province</TableHead>
                  <TableHead>Entry Level</TableHead>
                  <TableHead>Mid-Level (3–5 yrs)</TableHead>
                  <TableHead>Senior / Supervisor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SALARY_TABLE.map((row) => (
                  <TableRow key={row.province}>
                    <TableCell className="font-medium">{row.province}</TableCell>
                    <TableCell className="text-sm">{row.entry}</TableCell>
                    <TableCell className="text-sm">{row.mid}</TableCell>
                    <TableCell className="text-sm">{row.senior}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Career Progression Roadmap</h2>
          <div className="flex flex-col sm:flex-row items-stretch gap-4">
            {CAREER_PATH.map((c, i) => (
              <div key={c.stage} className="flex-1 flex items-center gap-3">
                <div className="rounded-xl border bg-secondary/30 p-5 flex-1 text-center">
                  <p className="font-semibold text-gray-900 text-sm">{c.stage}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{c.timing}</p>
                </div>
                {i < CAREER_PATH.length - 1 && <span className="hidden sm:block text-gray-300 text-xl">→</span>}
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
