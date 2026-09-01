import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { CircleCheck } from '@/components/animate-ui/icons';

const POINTS = [
  'Licensed and regulated immigration consulting partners',
  'Dedicated support from application to landing — and beyond',
  'Specialized expertise in the PSW and healthcare-worker pathway',
  'Transparent pricing with no hidden fees',
];

export default function AboutSection() {
  return (
    <section className="section bg-secondary/40">
      <div className="container grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">Who We Are</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">
            A Consultancy Built Around Real Outcomes
          </h2>
          <p className="mt-4 text-gray-600">
            CanadaDigitoba was founded to close the gap between ambitious international students and skilled workers,
            and the complex, ever-changing world of Canadian immigration. Our mission is simple: give every client an
            honest assessment, a clear plan, and hands-on support until they're settled in Canada.
          </p>
          <p className="mt-4 text-gray-600">
            We've built particular depth in the Personal Support Worker pathway, partnering with recognized training
            institutions and employers to give internationally trained caregivers a reliable route to a Canadian
            career and permanent residency.
          </p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((point, i) => (
              <li key={point} className="flex items-start gap-2.5">
                <CircleCheck
                  size={20}
                  className="text-primary shrink-0 mt-0.5"
                  animateOnView
                  animateOnViewOnce
                  delay={i * 120}
                />
                <span className="text-gray-700 text-sm">{point}</span>
              </li>
            ))}
          </ul>
          <Button className="mt-7" variant="outline" asChild>
            <Link to="/about">More About Our Story</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-white border p-6 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-primary">15,000+</p>
            <p className="text-sm text-gray-600 mt-1">Applications Processed</p>
          </div>
          <div className="rounded-xl bg-white border p-6 text-center shadow-sm mt-8">
            <p className="text-3xl font-extrabold text-primary">98%</p>
            <p className="text-sm text-gray-600 mt-1">Client Satisfaction</p>
          </div>
          <div className="rounded-xl bg-white border p-6 text-center shadow-sm">
            <p className="text-3xl font-extrabold text-primary">10+</p>
            <p className="text-sm text-gray-600 mt-1">Years of Experience</p>
          </div>
          <div className="rounded-xl bg-white border p-6 text-center shadow-sm mt-8">
            <p className="text-3xl font-extrabold text-primary">30+</p>
            <p className="text-sm text-gray-600 mt-1">Partner Institutions</p>
          </div>
        </div>
      </div>
    </section>
  );
}
