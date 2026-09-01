import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { ArrowRight } from '@/components/animate-ui/icons';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const NOC_CODES = [
  { code: 'NOC 44100', description: 'Covers in-home PSW roles (Home Support Workers, Caregivers)' },
  { code: 'NOC 31303', description: 'Covers hospital and long-term care PSWs (Nurse Aides, Orderlies)' },
];

const CRS_BOOSTERS = [
  { factor: '1 year Canadian work experience', points: '+40 points' },
  { factor: '2 years Canadian work experience', points: '+53 points' },
  { factor: '3+ years Canadian work experience', points: '+64 points' },
  { factor: 'Canadian post-secondary education', points: '+15 points' },
  { factor: 'French language proficiency', points: '+15–50 points' },
  { factor: 'Sibling in Canada (citizen/PR)', points: '+15 points' },
  { factor: 'Provincial nomination', points: '+600 points' },
];

const PATHWAYS = [
  {
    name: 'Express Entry – Federal Skilled Worker',
    tag: 'Most Popular',
    noc: 'NOC 44100 / 31303',
    experience: '1 year full-time',
    timeline: '6–12 months for PR',
    process: 'Complete PSW certification, gain one year Canadian work experience, create an Express Entry profile, receive an Invitation to Apply, and submit within 60 days.',
  },
  {
    name: 'Home Support Worker Pilot (HSWP)',
    tag: 'PSW Dedicated Stream',
    noc: 'NOC 44100',
    experience: '24 months over 3 years',
    timeline: '12–18 months for PR',
    process: 'A federal pathway created specifically due to high demand for personal care workers. Work under a valid permit, accumulate eligible experience, secure a job offer, and apply.',
  },
  {
    name: 'Provincial Nominee Programs (PNP)',
    tag: 'Multiple Provinces',
    noc: 'NOC 44100 / 31303',
    experience: '6 months to 1 year',
    timeline: '8–18 months for PR',
    process: 'Every province operates its own stream. Ontario, BC, Alberta, and Manitoba actively target healthcare workers including PSWs: work in the target province, apply to its provincial stream, receive nomination, then apply federally.',
  },
  {
    name: 'Atlantic Immigration Program (AIP)',
    tag: 'Atlantic Provinces',
    noc: 'NOC 44100 / 31303',
    experience: 'Job offer required',
    timeline: '6–12 months for PR',
    process: 'Nova Scotia, New Brunswick, PEI, and Newfoundland are aggressively recruiting PSWs. Secure a job offer from a designated employer, obtain provincial endorsement, submit your PR application, and receive residency.',
  },
];

const TIMELINE = [
  { period: 'Months 0–8', milestone: 'Complete PSW Course' },
  { period: 'Months 8–20', milestone: 'Work as Certified PSW' },
  { period: 'Month 20', milestone: 'Submit Express Entry or PNP' },
  { period: 'Months 26–32', milestone: 'Receive Invitation to Apply' },
  { period: 'Months 32–44', milestone: 'Become Permanent Resident' },
];

export default function PSWPRPathwayPage() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <p className="text-primary font-semibold text-sm uppercase tracking-wide">PR &amp; Immigration</p>
          <h1 className="mt-2 text-4xl md:text-5xl font-extrabold text-gray-900">
            How PSW Work Experience Earns You Permanent Residence in Canada 🍁
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            A PSW career is one of the fastest routes to Canadian PR — Canada offers multiple dedicated immigration
            pathways for Personal Support Workers.
          </p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container grid sm:grid-cols-2 gap-5 max-w-2xl">
          {NOC_CODES.map((n) => (
            <div key={n.code} className="rounded-xl border bg-secondary/30 p-5">
              <p className="font-bold text-primary">{n.code}</p>
              <p className="mt-1.5 text-sm text-gray-600">{n.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Four PR Pathways for PSWs</h2>
          <p className="text-gray-600 mb-8">Each has different requirements and timelines — your counsellor will help you pick the fastest realistic route.</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {PATHWAYS.map((p) => (
              <Card key={p.name}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-900">{p.name}</h3>
                    <Badge variant="secondary" className="shrink-0">{p.tag}</Badge>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">NOC</dt>
                      <dd className="font-medium text-gray-900">{p.noc}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Min. experience</dt>
                      <dd className="font-medium text-gray-900">{p.experience}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Timeline</dt>
                      <dd className="font-medium text-gray-900">{p.timeline}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-sm text-gray-600">{p.process}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container max-w-2xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">CRS Points Boosters</h2>
          <p className="text-gray-600 mb-6">
            The Comprehensive Ranking System (CRS) awards points for factors like these — every point matters when
            competing for an Invitation to Apply.
          </p>
          <div className="rounded-xl border overflow-hidden">
            {CRS_BOOSTERS.map((b, i) => (
              <div key={b.factor} className={`flex justify-between items-center px-5 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-secondary/30'}`}>
                <span className="text-gray-700">{b.factor}</span>
                <span className="font-semibold text-primary">{b.points}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Overall PSW-to-PR Timeline</h2>
          <div className="space-y-4">
            {TIMELINE.map((t) => (
              <div key={t.period} className="flex items-center gap-4 rounded-lg border bg-white p-4">
                <span className="shrink-0 rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5">
                  {t.period}
                </span>
                <span className="text-sm text-gray-700">{t.milestone}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-muted-foreground text-center">
            Timelines are general estimates based on typical cases, not a guarantee — actual processing times depend
            on IRCC and provincial program conditions, which change. No consultancy can guarantee a PR outcome; we
            guarantee a complete, accurate, well-prepared application.
          </p>
        </div>
      </section>

      <section className="bg-primary">
        <div className="container py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Your PSW-to-PR Journey?</h2>
          <p className="mt-3 text-red-100 max-w-xl mx-auto">
            Book a free counselling session — we'll map out the fastest realistic pathway for your background.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="mt-7 gap-2"
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => openConsultation({ intendedProgram: 'PSW Pathway to Canada', leadSource: 'psw_section' })}
          >
            Get Free Counselling
            <ArrowRight size={16} animate={hover} />
          </Button>
        </div>
      </section>
    </>
  );
}
