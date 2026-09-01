import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import * as api from '@/lib/api';

const CHANNELS = ['Meta Ads', 'Instagram Boost', 'Google Ads', 'TikTok', 'YouTube', 'SEO / Organic', 'Other'];
const OBJECTIVES = ['Lead Generation', 'Awareness', 'Traffic', 'Applications', 'Conversions', 'Engagement', 'Other'];
const STATUSES = ['Active', 'Paused', 'Completed', 'Stopped'];
const DECISIONS = ['', 'Scale', 'Keep', 'Modify', 'Pause', 'Stop'];

const EMPTY_FORM = {
  name: '',
  channel: 'Meta Ads',
  platform: '',
  program: '',
  objective: 'Lead Generation',
  status: 'Active',
  startDate: '',
  endDate: '',
  spend: '',
  impressions: '',
  clicks: '',
  adLink: '',
  utmSlug: '',
  decision: '',
  notes: '',
};

/**
 * Create or edit a campaign. Only the ad-platform numbers live here — leads,
 * qualified leads, applications, etc. are computed automatically from real
 * CRM records once the campaign starts pulling in leads (see
 * AdsDashboardPage), so there's nothing to fill in for those.
 */
export default function AdCampaignFormModal({ campaign, open, onOpenChange, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const isEdit = !!campaign;

  useEffect(() => {
    if (campaign) {
      setForm({
        name: campaign.name || '',
        channel: campaign.channel || 'Meta Ads',
        platform: campaign.platform || '',
        program: campaign.program || '',
        objective: campaign.objective || 'Lead Generation',
        status: campaign.status || 'Active',
        startDate: campaign.startDate ? campaign.startDate.slice(0, 10) : '',
        endDate: campaign.endDate ? campaign.endDate.slice(0, 10) : '',
        spend: campaign.spend ?? '',
        impressions: campaign.impressions ?? '',
        clicks: campaign.clicks ?? '',
        adLink: campaign.adLink || '',
        utmSlug: campaign.utmSlug || '',
        decision: campaign.decision || '',
        notes: campaign.notes || '',
      });
    } else if (open) {
      setForm(EMPTY_FORM);
    }
  }, [campaign, open]);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Campaign name is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        spend: form.spend === '' ? 0 : Number(form.spend),
        impressions: form.impressions === '' ? 0 : Number(form.impressions),
        clicks: form.clicks === '' ? 0 : Number(form.clicks),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
      };
      const res = isEdit ? await api.updateAdCampaign(campaign._id, payload) : await api.createAdCampaign(payload);
      toast({ title: isEdit ? 'Campaign updated' : 'Campaign created' });
      onSaved?.(res.data);
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'Could not save', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Campaign' : 'New Campaign'}</DialogTitle>
          <DialogDescription>
            Ad-platform numbers only — leads through enrolments are pulled automatically from the CRM.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ac-name">Campaign Name</Label>
            <Input id="ac-name" value={form.name} onChange={update('name')} placeholder="PSW August Meta Leads" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={(v) => setForm((f) => ({ ...f, channel: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-platform">Platform (optional)</Label>
              <Input id="ac-platform" value={form.platform} onChange={update('platform')} placeholder="Instagram, Facebook..." />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ac-program">Program</Label>
              <Input id="ac-program" value={form.program} onChange={update('program')} placeholder="PSW Pathway to Canada" />
            </div>
            <div className="space-y-1.5">
              <Label>Objective</Label>
              <Select value={form.objective} onValueChange={(v) => setForm((f) => ({ ...f, objective: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTIVES.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Your Decision (optional)</Label>
              <Select value={form.decision || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, decision: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Not decided yet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not decided yet</SelectItem>
                  {DECISIONS.filter(Boolean).map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ac-start">Start Date</Label>
              <Input id="ac-start" type="date" value={form.startDate} onChange={update('startDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-end">End Date (optional)</Label>
              <Input id="ac-end" type="date" value={form.endDate} onChange={update('endDate')} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="ac-spend">Spend ($)</Label>
              <Input id="ac-spend" type="number" min="0" step="0.01" value={form.spend} onChange={update('spend')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-impressions">Impressions</Label>
              <Input id="ac-impressions" type="number" min="0" value={form.impressions} onChange={update('impressions')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ac-clicks">Clicks</Label>
              <Input id="ac-clicks" type="number" min="0" value={form.clicks} onChange={update('clicks')} placeholder="0" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ac-link">Ad / Post Link (optional)</Label>
            <Input id="ac-link" value={form.adLink} onChange={update('adLink')} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ac-utm">
              utm_campaign tag <span className="text-muted-foreground font-normal">(auto-attributes leads to this campaign)</span>
            </Label>
            <Input
              id="ac-utm"
              value={form.utmSlug}
              onChange={update('utmSlug')}
              placeholder="psw-aug-meta-001"
            />
            <p className="text-xs text-muted-foreground">
              Add <code>?utm_campaign={form.utmSlug || 'this-value'}</code> to your ad's landing page link — any lead
              that comes through it gets linked to this campaign automatically. Letters, numbers, hyphens, underscores
              only.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ac-notes">Notes (optional)</Label>
            <Textarea id="ac-notes" rows={3} value={form.notes} onChange={update('notes')} placeholder="Main issue, what to try next..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Campaign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
