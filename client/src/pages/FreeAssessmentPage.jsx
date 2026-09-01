import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import ConsultationForm from '@/components/forms/ConsultationForm.jsx';

export default function FreeAssessmentPage() {
  return (
    <section className="section">
      <div className="container max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Free Assessment</h1>
          <p className="mt-4 text-gray-600">
            Tell us about your background and goals — a licensed counsellor will review your profile and respond
            within 1-2 business days with an honest, personalized assessment.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>Takes about 3 minutes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ConsultationForm defaults={{ leadSource: 'website' }} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
