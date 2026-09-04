import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table.jsx';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { useToast } from '@/components/ui/toast.jsx';
import AdCampaignFormModal from '@/components/admin/AdCampaignFormModal.jsx';
import { formatCurrency, formatPercent, formatMultiple } from '@/lib/utils';
import * as api from '@/lib/api';

const CHANNELS = ['Meta Ads', 'Instagram Boost', 'Google Ads', 'TikTok', 'YouTube', 'SEO / Organic', 'Other'];
const STATUSES = ['Active', 'Paused', 'Completed', 'Stopped'];

const STATUS_VARIANT = { Active: 'success', Paused: 'warning', Completed: 'secondary', Stopped: 'destructive' };
const DECISION_VARIANT = {
  Scale: 'success',
  Keep: 'info',
  Modify: 'warning',
  Pause: 'warning',
  Stop: 'destructive',
  'Stop / Review': 'destructive',
  'Too early to review': 'secondary',
};

/** Simple horizontal bar — same no-library pattern as AnalyticsPage. */
function Bar({ label, value, displayValue, max }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-700 truncate pr-2">{label}</span>
        <span className="font-medium text-gray-900 shrink-0">{displayValue ?? value}</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4 text-center">
        <p className="text-2xl font-extrabold text-gray-900">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

/**
 * "Spend → Leads → Qualified Leads → Applications → Deposits → Enrolments"
 * — the ads/marketing decision dashboard. Ad-platform numbers (spend,
 * impressions, clicks) are entered by hand per campaign; everything from
 * Leads onward is computed live from real CRM records attributed to that
 * campaign (see server/controllers/adCampaignController.js) — never a
 * second, manually-kept set of numbers to fall out of sync with reality.
 */
export default function AdsDashboardPage() {
  const { toast } = useToast();
  const [overview, setOverview] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);

  const loadOverview = () => {
    setLoadingOverview(true);
    api
      .fetchAdCampaignOverview()
      .then((res) => setOverview(res.data))
      .finally(() => setLoadingOverview(false));
  };

  const loadCampaigns = () => {
    setLoadingCampaigns(true);
    const params = {};
    if (channelFilter !== 'All') params.channel = channelFilter;
    if (statusFilter !== 'All') params.status = statusFilter;
    api
      .fetchAdCampaigns(params)
      .then((res) => setCampaigns(res.data))
      .finally(() => setLoadingCampaigns(false));
  };

  useEffect(loadOverview, []);
  useEffect(loadCampaigns, [channelFilter, statusFilter]);

  const refreshAll = () => {
    loadOverview();
    loadCampaigns();
  };

  const handleDelete = async (campaign) => {
    if (!window.confirm(`Delete "${campaign.name}"? Leads already attributed to it will just become unattributed.`)) return;
    try {
      await api.deleteAdCampaign(campaign._id);
      toast({ title: 'Campaign deleted' });
      refreshAll();
    } catch (err) {
      toast({ title: 'Could not delete', description: err.response?.data?.message, variant: 'destructive' });
    }
  };

  const maxChannelSpend = overview ? Math.max(...overview.byChannel.map((c) => c.spend), 1) : 1;
  const maxChannelLeads = overview ? Math.max(...overview.byChannel.map((c) => c.leads), 1) : 1;
  const maxFunnel = overview ? Math.max(...Object.values(overview.funnel), 1) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ads Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Meta, Instagram boosts, Google, SEO, and everything else — one place to see what's actually working.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {loadingOverview || !overview ? (
            <p className="text-sm text-muted-foreground py-10 text-center">Loading...</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard label="Total Spend" value={formatCurrency(overview.totals.spend)} />
                <KpiCard label="Collected Revenue" value={formatCurrency(overview.totals.revenueCAD)} sub="CAD" />
                <KpiCard label="ROAS" value={formatMultiple(overview.blended.roas)} sub={`Target 3.0x`} />
                <KpiCard label="Leads" value={overview.totals.leads} />
                <KpiCard label="Qualified Leads" value={overview.totals.qualifiedLeads} sub={formatPercent(overview.blended.qualifiedRate)} />
                <KpiCard label="Enrolments" value={overview.totals.enrolments} />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <KpiCard label="CTR" value={formatPercent(overview.blended.ctr)} />
                <KpiCard label="Cost / Lead" value={formatCurrency(overview.blended.cpl)} />
                <KpiCard label="Cost / Qualified" value={formatCurrency(overview.blended.cpql)} />
                <KpiCard label="Cost / Enrolment" value={formatCurrency(overview.blended.cac)} />
                <KpiCard label="Interested" value={overview.totals.interestedLeads} />
                <KpiCard label="Active Campaigns" value={`${overview.activeCampaignCount} / ${overview.campaignCount}`} />
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Funnel Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Bar label="Leads" value={overview.funnel.leads} max={maxFunnel} />
                    <Bar label="Qualified Leads" value={overview.funnel.qualifiedLeads} max={maxFunnel} />
                    <Bar label="Interested" value={overview.funnel.interestedLeads} max={maxFunnel} />
                    <Bar label="Enrolments" value={overview.funnel.enrolments} max={maxFunnel} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Spend & Leads by Channel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {overview.byChannel.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No campaigns yet.</p>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spend</p>
                          {overview.byChannel.map((c) => (
                            <Bar key={c.channel} label={c.channel} value={c.spend} displayValue={formatCurrency(c.spend)} max={maxChannelSpend} />
                          ))}
                        </div>
                        <div className="space-y-2.5 pt-2 border-t">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Qualified Leads</p>
                          {overview.byChannel.map((c) => (
                            <Bar key={c.channel} label={c.channel} value={c.qualifiedLeads} max={maxChannelLeads} />
                          ))}
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  {overview.topCampaigns.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No campaigns yet — add one from the Campaigns tab.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Spend</TableHead>
                            <TableHead>Q. Leads</TableHead>
                            <TableHead>ROAS</TableHead>
                            <TableHead>Suggested</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.topCampaigns.map(({ campaign, stats }) => (
                            <TableRow key={campaign._id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{campaign.channel}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(campaign.spend)}</TableCell>
                              <TableCell className="text-sm">{stats.qualifiedLeads}</TableCell>
                              <TableCell className="text-sm">{formatMultiple(stats.roas)}</TableCell>
                              <TableCell>
                                <Badge variant={DECISION_VARIANT[stats.suggestedDecision] || 'secondary'}>{stats.suggestedDecision}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {overview.needsAttention.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/40">
                  <CardHeader>
                    <CardTitle className="text-base text-amber-900">Needs Attention</CardTitle>
                    <p className="text-xs text-amber-800">Spent enough to judge, zero qualified leads so far.</p>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Campaign</TableHead>
                            <TableHead>Channel</TableHead>
                            <TableHead>Spend</TableHead>
                            <TableHead>Leads</TableHead>
                            <TableHead>CPL</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overview.needsAttention.map(({ campaign, stats }) => (
                            <TableRow key={campaign._id}>
                              <TableCell className="font-medium">{campaign.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{campaign.channel}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(campaign.spend)}</TableCell>
                              <TableCell className="text-sm">{stats.leads}</TableCell>
                              <TableCell className="text-sm">{formatCurrency(stats.cpl)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Channels</SelectItem>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => {
                setEditingCampaign(null);
                setModalOpen(true);
              }}
            >
              New Campaign
            </Button>
          </div>

          <div className="rounded-xl border bg-white overflow-hidden">
            {loadingCampaigns ? (
              <p className="py-10 text-center text-sm text-muted-foreground">Loading...</p>
            ) : campaigns.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No campaigns yet. Create one to get started.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Channel</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Spend</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Qualified</TableHead>
                      <TableHead>CPQL</TableHead>
                      <TableHead>ROAS</TableHead>
                      <TableHead>Suggested</TableHead>
                      <TableHead>Decision</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {c.name}
                          {c.program && <div className="text-xs text-muted-foreground">{c.program}</div>}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{c.channel}</TableCell>
                        <TableCell>
                          <Badge variant={STATUS_VARIANT[c.status] || 'secondary'}>{c.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{formatCurrency(c.spend)}</TableCell>
                        <TableCell className="text-sm">{c.stats.leads}</TableCell>
                        <TableCell className="text-sm">{c.stats.qualifiedLeads}</TableCell>
                        <TableCell className="text-sm">{formatCurrency(c.stats.cpql)}</TableCell>
                        <TableCell className="text-sm">{formatMultiple(c.stats.roas)}</TableCell>
                        <TableCell>
                          <Badge variant={DECISION_VARIANT[c.stats.suggestedDecision] || 'secondary'} className="whitespace-nowrap">
                            {c.stats.suggestedDecision}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.decision || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            className="mr-1.5"
                            onClick={() => {
                              setEditingCampaign(c);
                              setModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c)}>
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AdCampaignFormModal campaign={editingCampaign} open={modalOpen} onOpenChange={setModalOpen} onSaved={refreshAll} />
    </div>
  );
}
