import { CheckCircle2, Target, Eye, HeartHandshake } from 'lucide-react';
import CTASection from '@/components/home/CTASection.jsx';
import Testimonials from '@/components/home/Testimonials.jsx';

const VALUES = [
  { icon: Target, title: 'Mission', body: 'To give every international student and skilled worker a clear, honest, and achievable path to a life in Canada.' },
  { icon: Eye, title: 'Vision', body: 'To be the most trusted name in student recruitment and PSW immigration support across West Africa, East Africa, and South Asia.' },
  { icon: HeartHandshake, title: 'Values', body: 'Transparency, integrity, and hands-on support — from your first consultation to your first day at work in Canada.' },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">About CanadaDigitoba</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            We're a student recruitment and immigration consultancy dedicated to helping ambitious people study, work,
            and settle in Canada — with deep expertise in the Personal Support Worker pathway.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid lg:grid-cols-3 gap-6">
          {VALUES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="rounded-xl border p-7 bg-white shadow-sm">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold text-lg text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-600">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section bg-secondary/40">
        <div className="container grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Why Families Trust Us</h2>
            <ul className="mt-6 space-y-3 text-sm text-gray-700">
              {[
                'Licensed and regulated immigration consulting partners on every file',
                'A dedicated specialization in the PSW and healthcare-worker pathway',
                'Clear, upfront pricing — no hidden fees, ever',
                'Support that continues after you land, not just until your visa is approved',
              ].map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white border p-8">
            <p className="text-gray-700 leading-relaxed">
              CanadaDigitoba was founded on a simple observation: too many talented, qualified people were being let
              down by unclear advice and unreliable agents. We built a consultancy that treats every client's journey
              to Canada as our own — grounded in real regulatory expertise, and focused on outcomes that actually
              change lives...
            </p>
          </div>
        </div>
      </section>

      <Testimonials />
      <CTASection />
    </>
  );
}
