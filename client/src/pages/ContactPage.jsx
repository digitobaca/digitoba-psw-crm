import { Mail } from 'lucide-react';
import { PhoneCall, MapPin } from '@/components/animate-ui/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import ConsultationForm from '@/components/forms/ConsultationForm.jsx';

export default function ContactPage() {
  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Contact Us</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Have questions before booking? Reach out directly, or fill out the form and a consultant will contact you
            within 1-2 business days.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-5 w-5 text-primary" /> Email
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">admissions@canadadigitoba.com</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <PhoneCall size={20} className="text-primary" animateOnView animateOnViewOnce /> Phone / WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">+1 (204) 000-0000</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={20} className="text-primary" animateOnView animateOnViewOnce delay={150} /> Office
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">Winnipeg, Manitoba, Canada</CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send Us a Message</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsultationForm defaults={{ leadSource: 'contact_page' }} />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
