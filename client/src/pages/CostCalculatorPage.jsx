import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';

// Rough, clearly-labeled planning estimates only — NOT sourced from any
// specific institution's actual published tuition. Real figures always come
// from the verified Program database (see /programs) or a counsellor.
const LEVEL_TUITION_ESTIMATE = {
  'PSW Certificate': 9000,
  Diploma: 15000,
  Bachelor: 20000,
  Master: 22000,
};
const LIVING_COST_PER_YEAR = 12000; // IRCC's commonly cited proof-of-funds baseline, excluding Quebec

export default function CostCalculatorPage() {
  const { openConsultation } = useConsultationModal();
  const [level, setLevel] = useState('Diploma');
  const [years, setYears] = useState('2');
  const [dependents, setDependents] = useState('0');

  const tuitionPerYear = LEVEL_TUITION_ESTIMATE[level] || 15000;
  const numYears = parseFloat(years) || 1;
  const numDependents = parseFloat(dependents) || 0;

  const totalTuition = tuitionPerYear * numYears;
  const totalLiving = LIVING_COST_PER_YEAR * numYears + numDependents * 5000 * numYears;
  const grandTotal = totalTuition + totalLiving;

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Cost Calculator</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            A rough planning estimate for tuition and living costs. Actual tuition varies by institution — see{' '}
            verified figures on our <a href="/programs" className="text-primary underline">Programs</a> page, or ask your counsellor.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container max-w-xl">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1.5">
                <Label>Program Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(LEVEL_TUITION_ESTIMATE).map((lvl) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Program Length (years)</Label>
                  <Input type="number" min="1" value={years} onChange={(e) => setYears(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Accompanying Dependents</Label>
                  <Input type="number" min="0" value={dependents} onChange={(e) => setDependents(e.target.value)} />
                </div>
              </div>

              <div className="rounded-lg border bg-secondary/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Tuition</span>
                  <span className="font-semibold">CAD {totalTuition.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimated Living Costs</span>
                  <span className="font-semibold">CAD {totalLiving.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base border-t pt-2 mt-2">
                  <span className="font-semibold text-gray-900">Estimated Total</span>
                  <span className="font-bold text-primary">CAD {grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Planning estimate only — not a quote from any specific institution. Actual costs depend on the
                program and college you choose.
              </p>

              <Button
                className="w-full"
                onClick={() =>
                  openConsultation({
                    leadSource: 'website',
                    intendedProgram: `${level} — cost calculator estimate CAD ${grandTotal.toLocaleString()}`,
                  })
                }
              >
                Get an Accurate Quote From a Counsellor
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
