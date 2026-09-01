import { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { ArrowRight } from '@/components/animate-ui/icons';

export default function CTASection() {
  const { openConsultation } = useConsultationModal();
  const [hover, setHover] = useState(false);

  return (
    <section className="bg-primary">
      <div className="container py-16 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Start Your Canadian Journey?</h2>
        <p className="mt-3 text-red-100 max-w-xl mx-auto">
          Book a free, no-obligation consultation and get a personalized roadmap in as little as 1-2 business days.
        </p>
        <Button
          size="lg"
          variant="secondary"
          className="mt-7 gap-2"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => openConsultation()}
        >
          Book Your Free Consultation
          <ArrowRight size={16} animate={hover} />
        </Button>
      </div>
    </section>
  );
}
