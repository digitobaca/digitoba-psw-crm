import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import * as api from '@/lib/api';

const STAGE_VARIANT = {
  'College Selected': 'secondary',
  'Documents Ready': 'secondary',
  Submitted: 'info',
  'Application Number Received': 'info',
  Offer: 'success',
  Refusal: 'destructive',
  'Deposit Paid': 'success',
  'LOA Received': 'success',
  'Visa Filed': 'warning',
  'Visa Approved': 'success',
  Enrolled: 'success',
};

export default function PortalApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .fetchPortalApplications()
      .then((res) => setApplications(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <p className="text-sm text-muted-foreground">Track every college application your counsellor has submitted.</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : applications.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No applications yet — your counsellor will create one once you've shortlisted a college and program.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {applications.map((app) => (
            <Card key={app._id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.college?.name}</h3>
                    <p className="text-sm text-muted-foreground">{app.program?.name}</p>
                  </div>
                  <Badge variant={STAGE_VARIANT[app.stage] || 'secondary'}>{app.stage}</Badge>
                </div>
                {app.applicationNumber && (
                  <p className="mt-3 text-xs text-muted-foreground">App #: {app.applicationNumber}</p>
                )}
                {app.intake && <p className="text-xs text-muted-foreground">Intake: {app.intake}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
