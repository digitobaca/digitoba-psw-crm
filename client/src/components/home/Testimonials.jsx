import { useState } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Star } from '@/components/animate-ui/icons';
import { TESTIMONIALS } from '@/data/testimonials';

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const total = TESTIMONIALS.length;

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);
  const t = TESTIMONIALS[index];

  return (
    <section className="section bg-white">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">Success Stories</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Real Results, Real Clients</h2>
        </div>

        <div className="mt-10 max-w-2xl mx-auto relative">
          <div className="rounded-2xl border bg-secondary/30 p-8 md:p-10 text-center">
            <Quote className="h-8 w-8 text-primary/40 mx-auto" />
            <p className="mt-4 text-lg text-gray-800 italic">&ldquo;{t.quote}&rdquo;</p>
            <div className="mt-5 flex justify-center gap-1">
              {Array.from({ length: t.rating }).map((_, i) => (
                // Re-keying on the active slide replays the fill-in animation each time the testimonial changes.
                <Star
                  key={`${index}-${i}`}
                  size={16}
                  className="text-amber-400"
                  animation="fill"
                  animate="fill"
                  delay={i * 80}
                />
              ))}
            </div>
            <p className="mt-3 font-semibold text-gray-900">{t.name}</p>
            <p className="text-sm text-gray-500">{t.location}</p>
            <p className="text-xs text-primary font-medium mt-1">{t.program}</p>
          </div>

          <button
            onClick={prev}
            aria-label="Previous testimonial"
            className="hidden sm:flex absolute top-1/2 -left-14 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-gray-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            aria-label="Next testimonial"
            className="hidden sm:flex absolute top-1/2 -right-14 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full border bg-white shadow-sm hover:bg-gray-50"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="flex sm:hidden justify-center gap-4 mt-4">
            <button onClick={prev} aria-label="Previous testimonial" className="h-9 w-9 flex items-center justify-center rounded-full border bg-white">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={next} aria-label="Next testimonial" className="h-9 w-9 flex items-center justify-center rounded-full border bg-white">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-5">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
