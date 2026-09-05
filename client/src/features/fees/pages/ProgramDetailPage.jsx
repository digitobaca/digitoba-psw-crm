import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { formatMoney } from '@/features/fees/format';
import * as feesApi from '@/features/fees/api';

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-gray-900">{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value}</p>
    </div>
  );
}

export default function ProgramDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    feesApi
      .fetchFeeProgram(id)
      .then((res) => setProgram(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>;
  if (!program) return <p className="py-10 text-center text-sm text-destructive">Program not found.</p>;

  return (
    <div className="space-y-6">
      <Button variant="outline" size="sm" onClick={() => navigate('/fees/programs')}>
        ← Back to programs
      </Button>

      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{program.name}</h1>
          <Badge variant="secondary">{program.type}</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {program.durationFull} · {program.enrolledCount} enrolled now
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5 space-y-2">
            <p className="font-semibold text-gray-900">Fee lines</p>
            {(program.feeLines || []).map((line, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{line.label}</span>
                <span className="font-medium">{formatMoney(line.amountCents)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t">
              <span>Total</span>
              <span>{formatMoney(program.totalCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm pt-2">
              <span className="text-gray-700">Self-funding price</span>
              <span className="font-medium">{formatMoney(program.selfFundingCents)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700">Int'l surcharge</span>
              <span className="font-medium">{formatMoney(program.intlSurchargeCents)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 space-y-2">
            <p className="font-semibold text-gray-900">Self-funding instalment plan</p>
            {(program.instalmentTemplate || []).map((row, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{row.label}</span>
                <span className="font-medium">{formatMoney(row.amountCents)}</span>
              </div>
            ))}
            {program.planNote && <p className="text-xs text-muted-foreground pt-2 border-t">{program.planNote}</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5 grid sm:grid-cols-3 gap-4">
          <Field label="Duration" value={program.durationFull} />
          <Field label="Hours total" value={program.hoursTotal} />
          <Field label="NOC code" value={program.nocCode} />
          <Field label="NOC" value={program.nocFull} />
          <Field label="TEER" value={program.teer} />
          <Field label="Express Entry eligible" value={program.expressEntryEligible} />
          <Field label="Placement" value={program.placement} />
          <Field label="Job assistance" value={program.jobAssistance} />
          <Field label="Admission requirements" value={program.admissionRequirements} />
          <Field label="Schedule" value={program.schedule} />
          <Field label="Bonus" value={program.bonus} />
          <Field label="BJO note" value={program.bjoNote} />
        </CardContent>
      </Card>
    </div>
  );
}
