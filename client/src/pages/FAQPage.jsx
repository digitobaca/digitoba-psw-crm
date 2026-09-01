import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion.jsx';
import CTASection from '@/components/home/CTASection.jsx';
import { FAQ_ITEMS } from '@/data/faq';

export default function FAQPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Frequently Asked Questions</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Answers to the questions we hear most from prospective students and PSW applicants.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-3xl">
          <Accordion type="single" collapsible className="bg-white rounded-xl border px-6">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.question} value={item.question}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <CTASection />
    </>
  );
}
