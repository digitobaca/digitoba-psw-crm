import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import * as api from '@/lib/api';

const FUNNEL_LABELS = {
  totalLeads: 'Total Leads',
  coldAttempted: 'Cold Attempted',
  warmLeads: 'Warm Lead+',
  hotLeads: 'Hot Lead+',
  interested: 'Interested+',
  enrolled: 'Enrolled',
};

const OUTCOME_LABELS = {
  notInterested: 'Not Interested',
  counselledNotEnrolled: 'Counselled, Not Enrolled',
  holdLead: 'Hold Lead',
  bjo: 'BJO',
};

/** Simple horizontal bar — no charting library needed for Phase 1. */
function Bar({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.fetchAnalyticsOverview().then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-sm text-muted-foreground">Loading analytics...</p>;

  const { funnel, outcomes, conversion, leadsBySource, leadsByCountry, revenueByCurrency, counsellorConversion } = data;
  const maxFunnel = Math.max(...Object.values(funnel), 1);
  const maxOutcome = Math.max(...Object.values(outcomes), 1);
  const maxSource = Math.max(...leadsBySource.map((s) => s.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-sm text-muted-foreground">Company-wide pipeline overview</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-extrabold text-primary">{conversion.leadToWarmPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">Lead → Warm</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-extrabold text-primary">{conversion.warmToInterestedPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">Warm → Interested</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-extrabold text-primary">{conversion.interestedToEnrolledPct}%</p>
            <p className="text-sm text-muted-foreground mt-1">Interested → Enrolled</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pipeline Funnel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(FUNNEL_LABELS).map(([key, label]) => (
            <Bar key={key} label={label} value={funnel[key]} max={maxFunnel} />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcomes</CardTitle>
          <p className="text-xs text-muted-foreground">Side/terminal stages — not part of forward pipeline progress.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(OUTCOME_LABELS).map(([key, label]) => (
            <Bar key={key} label={label} value={outcomes[key]} max={maxOutcome} />
          ))}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Source</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leadsBySource.length === 0 ? (
              <p className="text-sm text-muted-foreground">No leads yet.</p>
            ) : (
              leadsBySource.map((s) => <Bar key={s.source} label={s.source.replace(/_/g, ' ')} value={s.count} max={maxSource} />)
            )}
            <p className="text-xs text-muted-foreground pt-2 border-t">
              Google/Meta Ads ROI needs actual ad-spend data — connect the Google Ads/Meta Ads API to unlock true ROI
              (revenue ÷ spend) per source. Counts above are the honest signal available today.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leads by Country</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leadsByCountry.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              leadsByCountry.map((c) => (
                <Bar key={c.country} label={c.country} value={c.count} max={Math.max(...leadsByCountry.map((x) => x.count), 1)} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counsellor Caseload</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {counsellorConversion.length === 0 ? (
              <p className="text-sm text-muted-foreground">No counsellors with assigned students yet.</p>
            ) : (
              counsellorConversion.map((c, i) => (
                <Bar
                  key={i}
                  label={c.counsellor.name}
                  value={c.assignedStudents}
                  max={Math.max(...counsellorConversion.map((x) => x.assignedStudents), 1)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Collected</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueByCurrency.length === 0 ? (
              <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {revenueByCurrency.map((r) => (
                  <li key={r.currency} className="flex justify-between text-sm">
                    <span className="text-gray-600">{r.currency}</span>
                    <span className="font-semibold text-gray-900">{r.total.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
