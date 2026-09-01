import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { Input } from '@/components/ui/input.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';

const EDUCATION_OPTIONS = ['High School', 'Diploma', "Bachelor's Degree", "Master's Degree"];

/**
 * A quick self-assessment — deliberately generic, disclosed thresholds, not
 * claiming to be an official admission/immigration determination. Every real
 * eligibility decision comes from a counsellor reviewing the verified
 * College/Program database, never from this calculator alone.
 */
export default function EligibilityCheckerPage() {
  const { openConsultation } = useConsultationModal();
  const [form, setForm] = useState({ education: '', percentage: '', ielts: '', workYears: '', budget: '' });
  const [result, setResult] = useState(null);

  const handleCheck = (e) => {
    e.preventDefault();
    let points = 0;
    if (["Bachelor's Degree", "Master's Degree"].includes(form.education)) points += 2;
    else if (form.education === 'Diploma') points += 1;

    const pct = parseFloat(form.percentage);
    if (pct >= 65) points += 2;
    else if (pct >= 50) points += 1;

    const ielts = parseFloat(form.ielts);
    if (ielts >= 6.5) points += 2;
    else if (ielts >= 5.5) points += 1;

    if (parseFloat(form.workYears) >= 1) points += 1;
    if (parseFloat(form.budget) > 0) points += 1;

    let verdict;
    if (points >= 6) verdict = { label: 'Strong Fit', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    else if (points >= 3) verdict = { label: 'Possible Fit — Needs Review', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
    else verdict = { label: 'Needs More Preparation', tone: 'text-gray-700 bg-gray-50 border-gray-200' };

    setResult(verdict);
  };

  const summary = `Eligibility Checker results — Education: ${form.education || '-'}, Academic %: ${form.percentage || '-'}, IELTS: ${form.ielts || '-'}, Work experience: ${form.workYears || '0'} yrs, Budget: ${form.budget || '-'}`;

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Eligibility Checker</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            A quick self-assessment to gauge your starting point. This is a rough indicator, not an official
            admission or immigration decision — a counsellor reviews every real application.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-xl">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleCheck} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Highest Education</Label>
                  <Select value={form.education} onValueChange={(v) => setForm((f) => ({ ...f, education: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Academic %/CGPA</Label>
                    <Input type="number" placeholder="e.g. 72" value={form.percentage} onChange={(e) => setForm((f) => ({ ...f, percentage: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>IELTS Overall</Label>
                    <Input type="number" step="0.5" placeholder="e.g. 6.5" value={form.ielts} onChange={(e) => setForm((f) => ({ ...f, ielts: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Work Experience (years)</Label>
                    <Input type="number" value={form.workYears} onChange={(e) => setForm((f) => ({ ...f, workYears: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Budget (CAD)</Label>
                    <Input type="number" placeholder="e.g. 20000" value={form.budget} onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))} />
                  </div>
                </div>
                <Button type="submit" className="w-full">
                  Check My Eligibility
                </Button>
              </form>

              {result && (
                <div className={`mt-6 rounded-lg border p-4 text-center ${result.tone}`}>
                  <p className="font-semibold">{result.label}</p>
                  <p className="mt-1 text-sm">Get a full, personalized assessment from a real counsellor — free.</p>
                  <Button
                    className="mt-3"
                    size="sm"
                    onClick={() => openConsultation({ leadSource: 'website', intendedProgram: form.education ? `Study in Canada (${form.education})` : undefined })}
                  >
                    Book My Free Consultation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          {result && <p className="mt-3 text-xs text-muted-foreground text-center">{summary}</p>}
        </div>
      </section>
    </>
  );
}
