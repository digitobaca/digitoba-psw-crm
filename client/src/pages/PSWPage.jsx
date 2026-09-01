import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { GraduationCap, Briefcase } from 'lucide-react';
import { CircleCheck, ArrowRight, BadgeCheck } from '@/components/animate-ui/icons';
import Testimonials from '@/components/home/Testimonials.jsx';
import FAQSection from '@/components/home/FAQSection.jsx';

const STATS = [
  { value: '100,000+', label: 'PSW Jobs Available in Canada' },
  { value: '90%+', label: 'Graduate Placement Rate' },
  { value: '$65K', label: 'Average Annual Salary' },
  { value: '6 Mo', label: 'Course Duration' },
];

const FEATURE_CARDS = [
  {
    icon: GraduationCap,
    title: 'Accredited PSW Courses',
    description: 'Government-approved programs at colleges across Ontario, BC, Alberta, and more.',
    to: '/psw-canada/courses',
  },
  {
    icon: Briefcase,
    title: 'High-Demand Job Placements',
    description: 'A 90%+ graduate placement rate. Work in LTC facilities, hospitals, and private homes.',
    to: '/psw-canada/placements',
  },
  {
    icon: BadgeCheck,
    title: 'Pathway to PR in Canada',
    description: 'PSW NOC codes are eligible for Express Entry, PNPs, and dedicated home-care streams.',
    to: '/psw-canada/pr-pathway',
    animated: true,
  },
  {
    icon: null,
    emoji: '💰',
    title: 'Competitive Salary',
    description: 'Average PSW salary ranges from $55,000–$65,000/year depending on province.',
    to: '/psw-canada/benefits',
  },
];

const WHY_PSW_BENEFITS = [
  'Job-protected roles — PSWs are essential workers',
  'Work across Ontario, BC, Alberta, Manitoba & more',
  'Eligible for government-funded training subsidies',
  'Clear pathway to Canadian PR and citizenship',
];

const QUICK_FACTS = [
  { metric: 'Program Duration', value: '6 Months' },
  { metric: 'Average Salary', value: '$55K – $65K/yr' },
  { metric: 'Graduate Placement Rate', value: '90%+' },
  { metric: 'PR Eligibility', value: 'Yes – Multiple Streams' },
  { metric: 'Provinces Hiring', value: 'All 10 Provinces' },
  { metric: 'Work Settings', value: 'LTC, Hospital, Home Care' },
];

const STEPS = [
  {
    step: '01',
    title: 'Eligibility Assessment',
    description:
      'We review your education, caregiving/healthcare background, and language proficiency to confirm your eligibility and map out the fastest realistic route.',
  },
  {
    step: '02',
    title: 'Course Enrolment',
    description:
      'We enrol you in a recognized Personal Support Worker training program at a Designated Learning Institution, with support through admissions and study permit prep.',
  },
  {
    step: '03',
    title: 'Work Permit',
    description:
      'Upon program completion, we prepare and submit your work permit application, connecting you with employers actively hiring PSWs across Canada.',
  },
  {
    step: '04',
    title: 'Permanent Residency',
    description:
      'As you build Canadian work experience, we guide you through provincial and federal PR pathways so your PSW career becomes a permanent home in Canada.',
  },
];

export default function PSWPage() {
  const { openConsultation } = useConsultationModal();
  const [heroHover, setHeroHover] = useState(false);
  const [qualifyHover, setQualifyHover] = useState(false);
  const [finalHover, setFinalHover] = useState(false);

  return (
    <>
      <section className="bg-gradient-to-b from-red-50 to-white py-16 md:py-20">
        <div className="container text-center">
          <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 mb-4">
            Flagship Pathway
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 max-w-3xl mx-auto">
            Build a Rewarding Career as a Personal Support Worker in Canada
          </h1>
          <p className="mt-5 max-w-2xl mx-auto text-gray-600 text-lg">
            Enrol in an accredited PSW course, land a high-paying healthcare job, and open the door to Permanent
            Residence in Canada.
          </p>
          <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="gap-2"
              onMouseEnter={() => setHeroHover(true)}
              onMouseLeave={() => setHeroHover(false)}
              onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
            >
              Start My Eligibility Assessment
              <ArrowRight size={16} animate={heroHover} />
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/psw-canada/pr-pathway">PR Pathway Guide</Link>
            </Button>
          </div>
        </div>

        <div className="container mt-12 grid grid-cols-2 sm:grid-cols-4 gap-5 max-w-3xl">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-primary">{s.value}</p>
              <p className="mt-1 text-xs md:text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Everything You Need to Succeed as a PSW in Canada
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURE_CARDS.map((f) => (
              <Link key={f.title} to={f.to} className="group">
                <Card className="h-full transition-shadow group-hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="h-11 w-11 rounded-lg bg-accent flex items-center justify-center">
                      {f.emoji ? (
                        <span className="text-2xl">{f.emoji}</span>
                      ) : f.animated ? (
                        <f.icon size={22} className="text-primary" animateOnView animateOnViewOnce animation="check" />
                      ) : (
                        <f.icon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <h3 className="mt-3 font-semibold text-gray-900 group-hover:text-primary transition-colors">{f.title}</h3>
                    <p className="mt-1.5 text-sm text-gray-600">{f.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Canada Urgently Needs Personal Support Workers</h2>
            <p className="mt-4 text-gray-600">
              Canada faces a critical shortage of healthcare workers, especially Personal Support Workers. The aging
              population means demand for PSWs will grow by 45% over the next decade. The government has created
              dedicated immigration pathways specifically for PSWs and home-care workers.
            </p>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {WHY_PSW_BENEFITS.map((point, i) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CircleCheck size={20} className="text-primary shrink-0 mt-0.5" animateOnView animateOnViewOnce delay={i * 120} />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-white border overflow-hidden">
            <div className="px-6 py-4 border-b bg-secondary/30">
              <h3 className="font-semibold text-gray-900">Quick PSW Facts</h3>
            </div>
            <Table>
              <TableBody>
                {QUICK_FACTS.map((f) => (
                  <TableRow key={f.metric}>
                    <TableCell className="text-sm text-gray-600">{f.metric}</TableCell>
                    <TableCell className="text-sm font-semibold text-gray-900 text-right">{f.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-12">Your 4-Step Journey to Canada</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border bg-secondary/30 p-6">
                <span className="text-3xl font-extrabold text-primary/30">{s.step}</span>
                <h4 className="mt-2 font-semibold text-gray-900">{s.title}</h4>
                <p className="mt-1.5 text-sm text-gray-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Who Is This Pathway For?</h2>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {[
                'Anyone with a high school diploma or higher and an interest in caregiving',
                'Nurses, caregivers, and healthcare aides looking to formalize their credentials in Canada',
                'Applicants with basic English or French proficiency (or working toward it)',
                'Anyone seeking a realistic, well-documented pathway to Canadian permanent residency',
              ].map((point, i) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CircleCheck size={20} className="text-primary shrink-0 mt-0.5" animateOnView animateOnViewOnce delay={i * 120} />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white border p-8">
            <h3 className="font-semibold text-lg text-gray-900">Not sure if you qualify?</h3>
            <p className="mt-2 text-sm text-gray-600">
              Book a free consultation and we'll assess your background against current PSW program requirements —
              no cost, no obligation.
            </p>
            <Button
              className="mt-5 w-full gap-2"
              onMouseEnter={() => setQualifyHover(true)}
              onMouseLeave={() => setQualifyHover(false)}
              onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
            >
              Book Your Free Consultation
              <ArrowRight size={16} animate={qualifyHover} />
            </Button>
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container">
          <h2 className="text-center text-3xl md:text-4xl font-bold text-gray-900 mb-3">Explore All PSW Resources</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { to: '/psw-canada/courses', emoji: '📚', label: 'PSW Courses in Canada' },
              { to: '/psw-canada/benefits', emoji: '💰', label: 'PSW Benefits & Salary' },
              { to: '/psw-canada/placements', emoji: '💼', label: 'Job Placements' },
              { to: '/psw-canada/pr-pathway', emoji: '🍁', label: 'PR & Immigration Guide' },
            ].map((r) => (
              <Link
                key={r.to}
                to={r.to}
                className="rounded-xl border bg-secondary/30 p-6 text-center font-medium text-gray-900 hover:border-primary hover:text-primary transition-colors"
              >
                <span className="text-2xl block mb-2">{r.emoji}</span>
                {r.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Testimonials />
      <FAQSection />

      <section className="bg-primary">
        <div className="container py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Your PSW Journey in Canada?</h2>
          <p className="mt-3 text-red-100 max-w-xl mx-auto">
            Book a free counselling session with our PSW experts. We'll help you choose the right course, find the
            best job placements, and guide your PR application.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-7 gap-2"
            onMouseEnter={() => setFinalHover(true)}
            onMouseLeave={() => setFinalHover(false)}
            onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
          >
            Get Free Counselling
            <ArrowRight size={16} animate={finalHover} />
          </Button>
        </div>
      </section>
    </>
  );
}
