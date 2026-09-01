import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useConsultationModal } from '@/hooks/useConsultationModal';
import { fetchPublicPrograms } from '@/lib/api';

export default function ProgramsPage() {
  const { openConsultation } = useConsultationModal();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicPrograms()
      .then((res) => setPrograms(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="bg-secondary/40 py-16 text-center">
        <div className="container">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">Programs</h1>
          <p className="mt-4 max-w-2xl mx-auto text-gray-600">
            Verified programs at partner Canadian institutions — from PSW certificates to Master's degrees.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground">Loading programs...</p>
          ) : programs.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">
              No verified programs published yet — check back soon, or book a free consultation to discuss options directly.
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program) => (
                <Card key={program._id}>
                  <CardContent className="pt-6">
                    <Badge variant="secondary">{program.level}</Badge>
                    <h3 className="mt-3 font-semibold text-lg text-gray-900">{program.name}</h3>
                    <p className="text-sm text-muted-foreground">{program.college?.name}</p>
                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                      {program.durationMonths && <p>Duration: {program.durationMonths} months</p>}
                      {program.tuitionAmount && (
                        <p>
                          Tuition: {program.tuitionAmount.toLocaleString()} {program.tuitionCurrency}
                        </p>
                      )}
                      {program.intakes?.length > 0 && <p>Intakes: {program.intakes.join(', ')}</p>}
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 w-full"
                      onClick={() => openConsultation({ intendedProgram: program.name, leadSource: 'website' })}
                    >
                      Ask About This Program
                    </Button>
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
