import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import { formatDate, resolveFileUrl } from '@/lib/utils';
import * as api from '@/lib/api';

const STATUS_VARIANT = { Pending: 'secondary', Uploaded: 'info', Verified: 'success', Rejected: 'destructive', Expired: 'warning' };

/**
 * The other half of the student portal's document upload — a counsellor
 * (or admin) opens each file the student submitted, checks it, and marks
 * it Verified or Rejected (with a reason), so document status is visible
 * to everyone working the case, not just the counsellor who checked it.
 */
export default function DocumentsTab({ student }) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .fetchDocuments({ student: student._id })
      .then((res) => setDocuments(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(load, [student._id]);

  const handleVerify = async (doc) => {
    setSaving(doc._id);
    try {
      const res = await api.updateDocument(doc._id, { status: 'Verified' });
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? res.data : d)));
      toast({ title: `${doc.type} verified` });
    } catch (err) {
      toast({ title: 'Could not verify', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const handleReject = async (doc) => {
    if (!rejectReason.trim()) {
      toast({ title: 'Add a reason', description: "Let the student know what's wrong with it.", variant: 'destructive' });
      return;
    }
    setSaving(doc._id);
    try {
      const res = await api.updateDocument(doc._id, { status: 'Rejected', comment: rejectReason.trim() });
      setDocuments((prev) => prev.map((d) => (d._id === doc._id ? res.data : d)));
      toast({ title: `${doc.type} rejected` });
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      toast({ title: 'Could not reject', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;

  return (
    <div className="space-y-3">
      {!loading && documents.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {verifiedCount} of {documents.length} document{documents.length !== 1 ? 's' : ''} verified.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground py-6 text-center">Loading...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">
          {student.name.split(' ')[0]} hasn't uploaded any documents yet.
        </p>
      ) : (
        <div className="max-h-80 overflow-y-auto space-y-2">
          {documents.map((doc) => (
            <div key={doc._id} className="rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{doc.type}</span>
                  <span className="text-xs text-muted-foreground">v{doc.version}</span>
                  <Badge variant={STATUS_VARIANT[doc.status] || 'secondary'}>{doc.status}</Badge>
                </div>
                <a
                  href={resolveFileUrl(doc.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Open file →
                </a>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Uploaded {formatDate(doc.uploadedAt || doc.createdAt)}</p>

              {doc.status === 'Verified' && doc.verifiedBy && (
                <p className="mt-1 text-xs text-emerald-700">Verified by {doc.verifiedBy.name} on {formatDate(doc.verifiedAt)}</p>
              )}

              {doc.comments?.length > 0 && (
                <div className="mt-2 space-y-1 border-t pt-2">
                  {doc.comments.map((c, i) => (
                    <p key={i} className="text-xs text-gray-600">
                      <span className="font-medium text-gray-800">{c.author?.name || 'Staff'}:</span> {c.text}
                    </p>
                  ))}
                </div>
              )}

              {(doc.status === 'Uploaded' || doc.status === 'Pending') && (
                <div className="mt-2 flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleVerify(doc)} disabled={saving === doc._id}>
                    {saving === doc._id ? 'Saving...' : 'Verify'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setRejectingId(rejectingId === doc._id ? null : doc._id)}
                  >
                    Reject
                  </Button>
                </div>
              )}

              {rejectingId === doc._id && (
                <div className="mt-2 space-y-1.5">
                  <Textarea
                    rows={2}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="What's wrong with it? (blurry, expired, wrong document...)"
                  />
                  <Button size="sm" variant="destructive" onClick={() => handleReject(doc)} disabled={saving === doc._id}>
                    {saving === doc._id ? 'Saving...' : 'Confirm Reject'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
