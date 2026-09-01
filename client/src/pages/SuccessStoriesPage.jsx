import { Star } from '@/components/animate-ui/icons';
import { TESTIMONIALS } from '@/data/testimonials';
import CTASection from '@/components/home/CTASection.jsx';

export default function SuccessStoriesPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Student Success Stories</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Real students, real outcomes — from application to life in Canada.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={t.name} className="rounded-2xl border bg-white p-6">
              <div className="flex gap-1">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} className="text-amber-400" animation="fill" animateOnView animateOnViewOnce delay={(i * 4 + j) * 60} />
                ))}
              </div>
              <p className="mt-3 text-sm text-gray-700 italic">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 font-semibold text-gray-900">{t.name}</p>
              <p className="text-xs text-muted-foreground">{t.location}</p>
              <p className="text-xs text-primary font-medium mt-1">{t.program}</p>
            </div>
          ))}
        </div>
      </section>

      <CTASection />
    </>
  );
}
