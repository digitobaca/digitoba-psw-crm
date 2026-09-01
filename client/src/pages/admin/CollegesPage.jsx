import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import CollegeFormModal from '@/components/admin/CollegeFormModal.jsx';
import * as api from '@/lib/api';

export default function CollegesPage() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const load = () => {
    setLoading(true);
    api
      .fetchColleges()
      .then((res) => setColleges(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setSelected(null);
    setModalOpen(true);
  };

  const openEdit = (college) => {
    setSelected(college);
    setModalOpen(true);
  };

  const handleSaved = (saved) => {
    setColleges((prev) => {
      const exists = prev.some((c) => c._id === saved._id);
      return exists ? prev.map((c) => (c._id === saved._id ? saved : c)) : [...prev, saved];
    });
    setSelected(saved);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
          <p className="text-sm text-muted-foreground">{colleges.length} institutions in the database</p>
        </div>
        <Button onClick={openNew}>Add College</Button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : colleges.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No colleges yet. Run <code>npm run seed:colleges</code> for sample data, or add one above.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Campuses</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {colleges.map((college) => (
                <TableRow key={college._id} className="cursor-pointer" onClick={() => openEdit(college)}>
                  <TableCell className="font-medium">{college.name}</TableCell>
                  <TableCell className="text-sm">{college.province}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{(college.campuses || []).join(', ') || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={college.verified ? 'success' : 'secondary'}>{college.verified ? 'Verified' : 'Unverified'}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <CollegeFormModal college={selected} open={modalOpen} onOpenChange={setModalOpen} onSaved={handleSaved} />
    </>
  );
}
