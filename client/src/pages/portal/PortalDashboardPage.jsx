import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import * as api from '@/lib/api';

const COMMON_DOCUMENT_TYPES = ['Passport', '12th Marksheet', 'Bachelor Degree', 'IELTS', 'Resume', 'Bank Statement'];

const PRE_DEPARTURE_CHECKLIST = [
  'Confirm your Letter of Acceptance (LOA)',
  'Apply for / confirm your study permit',
  'Book flights and temporary accommodation',
  'Arrange Guaranteed Investment Certificate (GIC) or proof of funds',
  'Get international health/travel insurance',
  'Pack for Canadian weather and register for orientation',
];

export default function PortalDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    api.fetchPortalProfile().then((res) => setProfile(res.data));
    api.fetchPortalDocuments().then((res) => setDocuments(res.data));
  }, []);

  if (!profile) return <p className="text-sm text-muted-foreground">Loading...</p>;

  const uploadedTypes = new Set(documents.map((d) => d.type));
  const missingDocs = COMMON_DOCUMENT_TYPES.filter((t) => !uploadedTypes.has(t));
  const isPreDeparture = profile.pipelineStage === 'Enrolled';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.name.split(' ')[0]}</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s where things stand with your application.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-4">
          <Badge className="text-sm px-3 py-1">{profile.pipelineStage}</Badge>
          {profile.assignedCounsellor && (
            <p className="text-sm text-muted-foreground">
              Your counsellor: <span className="font-medium text-gray-900">{profile.assignedCounsellor.name}</span>
              {profile.assignedCounsellor.email && ` · ${profile.assignedCounsellor.email}`}
            </p>
          )}
        </CardContent>
      </Card>

      {missingDocs.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Missing Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-amber-900 space-y-1">
              {missingDocs.map((doc) => (
                <li key={doc}>✗ {doc}</li>
              ))}
            </ul>
            <Link to="/portal/documents" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
              Upload documents →
            </Link>
          </CardContent>
        </Card>
      )}

      {isPreDeparture && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pre-Departure Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1.5 text-gray-700">
              {PRE_DEPARTURE_CHECKLIST.map((item) => (
                <li key={item}>☐ {item}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
