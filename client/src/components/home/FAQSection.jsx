import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion.jsx';
import { FAQ_ITEMS } from '@/data/faq';

export default function FAQSection() {
  const preview = FAQ_ITEMS.slice(0, 5);

  return (
    <section className="section bg-secondary/40">
      <div className="container max-w-3xl">
        <div className="text-center">
          <span className="text-primary font-semibold text-sm uppercase tracking-wide">FAQ</span>
          <h2 className="mt-2 text-3xl md:text-4xl font-bold text-gray-900">Frequently Asked Questions</h2>
        </div>

        <Accordion type="single" collapsible className="mt-10 bg-white rounded-xl border px-6">
          {preview.map((item) => (
            <AccordionItem key={item.question} value={item.question}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <p className="text-center mt-6">
          <Link to="/faq" className="text-primary font-medium hover:underline">
            View all FAQs →
          </Link>
        </p>
      </div>
    </section>
  );
}
