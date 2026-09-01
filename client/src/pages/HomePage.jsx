import Hero from '@/components/home/Hero.jsx';
import PSWSection from '@/components/home/PSWSection.jsx';
import AboutSection from '@/components/home/AboutSection.jsx';
import Testimonials from '@/components/home/Testimonials.jsx';
import FAQSection from '@/components/home/FAQSection.jsx';
import BlogPreview from '@/components/home/BlogPreview.jsx';
import CTASection from '@/components/home/CTASection.jsx';

export default function HomePage() {
  return (
    <>
      <Hero />
      <PSWSection />
      <AboutSection />
      <Testimonials />
      <FAQSection />
      <BlogPreview />
      <CTASection />
    </>
  );
}
