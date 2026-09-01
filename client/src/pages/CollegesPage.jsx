import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { fetchPublicColleges } from '@/lib/api';

export default function CollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicColleges()
      .then((res) => setColleges(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Verified Colleges</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            A hand-reviewed database of Canadian institutions — every entry here has been checked by our team, not
            generated automatically.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading colleges...</p>
          ) : colleges.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No verified colleges published yet — check back soon, or book a free consultation to discuss options directly.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {colleges.map((college) => (
                <Card key={college._id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-lg text-gray-900">{college.name}</h3>
                      {college.isDesignatedLearningInstitution && <Badge variant="success">DLI</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{college.province}</p>
                    {college.campuses?.length > 0 && (
                      <p className="text-sm text-gray-600 mt-2">Campuses: {college.campuses.join(', ')}</p>
                    )}
                    {college.website && (
                      <a
                        href={college.website}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-sm text-primary font-medium hover:underline"
                      >
                        Visit website →
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
