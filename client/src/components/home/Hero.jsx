import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { ShieldCheck } from 'lucide-react';
import { Users, BadgeCheck, ArrowRight } from '@/components/animate-ui/icons';

const TRUST_BADGES = [
  { icon: Users, label: '15,000+ Successful Applications' },
  { icon: BadgeCheck, label: '98% Client Satisfaction' },
  { icon: ShieldCheck, label: '10+ Years of Experience', static: true },
];

export default function Hero() {
  const { openConsultation } = useConsultationModal();
  const [exploreHover, setExploreHover] = useState(false);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-red-50 via-white to-white">
      <div className="container py-20 md:py-28 text-center">
        <span className="inline-block rounded-full bg-accent text-accent-foreground text-xs font-semibold px-3 py-1 mb-5">
          Student Recruitment &amp; PSW Immigration Specialists
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 max-w-4xl mx-auto">
          Your Trusted Partner for a Successful <span className="text-gradient">Immigration to Canada</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          From study permits to the Personal Support Worker (PSW) pathway, we guide you through every step — from
          eligibility assessment to permanent residency — with honest advice and hands-on support.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" onClick={() => openConsultation()}>
            Book Your Free Consultation
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="/psw-canada"
              className="inline-flex items-center gap-1.5"
              onMouseEnter={() => setExploreHover(true)}
              onMouseLeave={() => setExploreHover(false)}
            >
              Explore the PSW Pathway
              <ArrowRight size={16} animate={exploreHover} />
            </a>
          </Button>
        </div>

        <dl className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {TRUST_BADGES.map(({ icon: Icon, label, static: isStatic }, i) => (
            <div key={label} className="flex flex-col items-center gap-2 rounded-xl border bg-white/70 p-5 shadow-sm">
              {isStatic ? (
                <Icon className="h-6 w-6 text-primary" />
              ) : (
                <Icon size={24} className="text-primary" animateOnView animateOnViewOnce delay={i * 150} />
              )}
              <dt className="text-sm font-semibold text-gray-800">{label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
