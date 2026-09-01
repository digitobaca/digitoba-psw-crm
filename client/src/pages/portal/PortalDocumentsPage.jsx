import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatDate } from '@/lib/utils';
import * as api from '@/lib/api';

const DOCUMENT_TYPES = [
  'Passport',
  '10th Marksheet',
  '12th Marksheet',
  'Bachelor Degree',
  'Master Degree',
  'Transcript',
  'IELTS',
  'PTE',
  'CELPIP',
  'TOEFL',
  'Resume',
  'Statement of Purpose',
  'Bank Statement',
  'Sponsorship Letter',
  'Work Experience Letter',
  'Passport Photo',
  'Other',
];

const STATUS_VARIANT = { Pending: 'secondary', Uploaded: 'info', Verified: 'success', Rejected: 'destructive', Expired: 'warning' };

export default function PortalDocumentsPage() {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .fetchPortalDocuments()
      .then((res) => setDocuments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!type || !file) {
      toast({ title: 'Select a document type and a file first', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('type', type);
      formData.append('file', file);
      await api.uploadPortalDocument(formData);
      toast({ title: 'Document uploaded' });
      setType('');
      fileInputRef.current.value = '';
      load();
    } catch (err) {
      toast({ title: 'Upload failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
        <p className="text-sm text-muted-foreground">Upload PDF, Word, or image files up to 10MB.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload a Document</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpload} className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1.5 flex-1 w-full">
              <Label>Document Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {DOCUMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex-1 w-full">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                className="flex h-10 w-full rounded-md border border-input bg-background text-sm file:mr-3 file:h-full file:border-0 file:bg-secondary file:px-3 file:text-sm"
              />
            </div>
            <Button type="submit" disabled={uploading} className="shrink-0">
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border bg-white overflow-hidden">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
        ) : documents.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No documents uploaded yet.</p>
        ) : (
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc._id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium text-sm text-gray-900">
                    {doc.type} <span className="text-muted-foreground font-normal">v{doc.version}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">Uploaded {formatDate(doc.uploadedAt || doc.createdAt)}</p>
                </div>
                <Badge variant={STATUS_VARIANT[doc.status] || 'secondary'}>{doc.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
