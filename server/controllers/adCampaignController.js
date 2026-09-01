const asyncHandler = require('express-async-handler');
const AdCampaign = require('../models/AdCampaign');
const Student = require('../models/Student');
const Payment = require('../models/Payment');

// Below this spend, a campaign hasn't had a fair chance yet — flagging it as
// "Stop" or "Modify" this early is how you kill something that just needed
// more data. Adjust once you have a feel for your own numbers; this is a
// starting default, not a rule proven for your business yet.
const MIN_REVIEW_SPEND = 50;
const TARGET_ROAS = 3;

/**
 * Everything past ad-platform numbers (leads, qualified leads, applications,
 * deposits, enrolments, revenue) is computed live from real CRM records
 * attributed to this campaign — never stored, never stale, never
 * double-entered. "Qualified"/"Application"/"Deposit"/"Student in Canada"
 * are literal stage names already in Student.PIPELINE_STAGES, so "how far
 * did this campaign's leads get" falls straight out of the existing
 * pipeline instead of a second, parallel tracking system.
 */
const computeCampaignStats = async (campaign) => {
  const stageIndex = (stage) => Student.PIPELINE_STAGES.indexOf(stage);
  const students = await Student.find({ campaign: campaign._id }).select('pipelineStage');

  const leads = students.length;
  const qualifiedLeads = students.filter((s) => stageIndex(s.pipelineStage) >= stageIndex('Qualified')).length;
  const applications = students.filter((s) => stageIndex(s.pipelineStage) >= stageIndex('Application')).length;
  const deposits = students.filter((s) => stageIndex(s.pipelineStage) >= stageIndex('Deposit')).length;
  const enrolments = students.filter((s) => stageIndex(s.pipelineStage) >= stageIndex('Student in Canada')).length;

  const studentIds = students.map((s) => s._id);
  const payments = studentIds.length
    ? await Payment.aggregate([
        { $match: { student: { $in: studentIds }, status: 'Paid' } },
        { $group: { _id: '$currency', total: { $sum: '$amount' } } },
      ])
    : [];
  const revenueByCurrency = payments.map((p) => ({ currency: p._id, total: p.total }));
  // ROAS/blended totals assume CAD as the primary currency (matches
  // Payment's own default) — other currencies are reported but not folded
  // into a single blended number, since that would mean picking an exchange
  // rate no one asked for.
  const revenueCAD = revenueByCurrency.find((r) => r.currency === 'CAD')?.total || 0;

  const { spend, impressions, clicks } = campaign;
  const ctr = impressions > 0 ? clicks / impressions : null;
  const cpl = leads > 0 ? spend / leads : null;
  const cpql = qualifiedLeads > 0 ? spend / qualifiedLeads : null;
  const cac = enrolments > 0 ? spend / enrolments : null;
  const roas = spend > 0 ? revenueCAD / spend : null;
  const qualifiedRate = leads > 0 ? qualifiedLeads / leads : null;

  let suggestedDecision;
  if (spend < MIN_REVIEW_SPEND) suggestedDecision = 'Too early to review';
  else if (leads === 0) suggestedDecision = 'Stop / Review';
  else if (qualifiedLeads === 0) suggestedDecision = 'Modify';
  else if (roas !== null && roas >= TARGET_ROAS) suggestedDecision = 'Scale';
  else if (qualifiedLeads > 0) suggestedDecision = 'Keep';
  else suggestedDecision = 'Modify';

  return {
    leads,
    qualifiedLeads,
    applications,
    deposits,
    enrolments,
    revenueByCurrency,
    revenueCAD,
    ctr,
    cpl,
    cpql,
    cac,
    roas,
    qualifiedRate,
    suggestedDecision,
  };
};

/** @desc List campaigns with computed performance stats. @route GET /api/ad-campaigns?channel=&status=&program= @access Private (admin) */
const getCampaigns = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.channel) filter.channel = req.query.channel;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.program) filter.program = req.query.program;

  const campaigns = await AdCampaign.find(filter).sort({ createdAt: -1 });
  const data = await Promise.all(
    campaigns.map(async (c) => ({ ...c.toObject(), stats: await computeCampaignStats(c) }))
  );

  res.json({ success: true, data });
});

/** @desc Get one campaign with stats. @route GET /api/ad-campaigns/:id @access Private (admin) */
const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await AdCampaign.findById(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  const stats = await computeCampaignStats(campaign);
  res.json({ success: true, data: { ...campaign.toObject(), stats } });
});

/** @desc Create a campaign. @route POST /api/ad-campaigns @access Private (admin) */
const createCampaign = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'channel',
    'platform',
    'program',
    'objective',
    'status',
    'startDate',
    'endDate',
    'spend',
    'impressions',
    'clicks',
    'adLink',
    'utmSlug',
    'decision',
    'notes',
  ];
  const payload = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }
  if (payload.utmSlug) payload.utmSlug = payload.utmSlug.toLowerCase().trim();

  const campaign = await AdCampaign.create({ ...payload, createdBy: req.user._id });
  res.status(201).json({ success: true, data: campaign });
});

/** @desc Update a campaign's details/numbers. @route PUT /api/ad-campaigns/:id @access Private (admin) */
const updateCampaign = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'channel',
    'platform',
    'program',
    'objective',
    'status',
    'startDate',
    'endDate',
    'spend',
    'impressions',
    'clicks',
    'adLink',
    'utmSlug',
    'decision',
    'notes',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.utmSlug) updates.utmSlug = updates.utmSlug.toLowerCase().trim();

  const campaign = await AdCampaign.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  res.json({ success: true, data: campaign });
});

/** @desc Delete a campaign (unlinks any attributed students rather than touching their records). @route DELETE /api/ad-campaigns/:id @access Private (admin) */
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await AdCampaign.findByIdAndDelete(req.params.id);
  if (!campaign) {
    res.status(404);
    throw new Error('Campaign not found');
  }
  await Student.updateMany({ campaign: campaign._id }, { campaign: null });
  res.json({ success: true, message: 'Campaign deleted' });
});

/**
 * @desc    Cross-campaign summary for the Ads Dashboard overview: totals,
 *          channel breakdown, funnel, and a simple leaderboard — the "KPI
 *          Dashboard" layer sitting on top of the per-campaign numbers above.
 * @route   GET /api/ad-campaigns/overview
 * @access  Private (admin)
 */
const getOverview = asyncHandler(async (req, res) => {
  const campaigns = await AdCampaign.find();
  const withStats = await Promise.all(campaigns.map(async (c) => ({ campaign: c, stats: await computeCampaignStats(c) })));

  const totals = withStats.reduce(
    (acc, { campaign, stats }) => {
      acc.spend += campaign.spend || 0;
      acc.impressions += campaign.impressions || 0;
      acc.clicks += campaign.clicks || 0;
      acc.leads += stats.leads;
      acc.qualifiedLeads += stats.qualifiedLeads;
      acc.applications += stats.applications;
      acc.deposits += stats.deposits;
      acc.enrolments += stats.enrolments;
      acc.revenueCAD += stats.revenueCAD;
      return acc;
    },
    { spend: 0, impressions: 0, clicks: 0, leads: 0, qualifiedLeads: 0, applications: 0, deposits: 0, enrolments: 0, revenueCAD: 0 }
  );

  const blended = {
    ctr: totals.impressions > 0 ? totals.clicks / totals.impressions : null,
    cpl: totals.leads > 0 ? totals.spend / totals.leads : null,
    cpql: totals.qualifiedLeads > 0 ? totals.spend / totals.qualifiedLeads : null,
    cac: totals.enrolments > 0 ? totals.spend / totals.enrolments : null,
    roas: totals.spend > 0 ? totals.revenueCAD / totals.spend : null,
    qualifiedRate: totals.leads > 0 ? totals.qualifiedLeads / totals.leads : null,
  };

  // Breakdown by channel — feeds the "Spend & Leads by Channel" bars.
  const byChannel = {};
  for (const { campaign, stats } of withStats) {
    const key = campaign.channel;
    if (!byChannel[key]) byChannel[key] = { channel: key, spend: 0, leads: 0, qualifiedLeads: 0, revenueCAD: 0 };
    byChannel[key].spend += campaign.spend || 0;
    byChannel[key].leads += stats.leads;
    byChannel[key].qualifiedLeads += stats.qualifiedLeads;
    byChannel[key].revenueCAD += stats.revenueCAD;
  }

  // Simple leaderboard: rank by qualified leads first (the framework's own
  // "don't keep a campaign just because CPL looks cheap" advice), applications
  // and ROAS as tiebreakers.
  const ranked = [...withStats].sort((a, b) => {
    if (b.stats.qualifiedLeads !== a.stats.qualifiedLeads) return b.stats.qualifiedLeads - a.stats.qualifiedLeads;
    if (b.stats.applications !== a.stats.applications) return b.stats.applications - a.stats.applications;
    return (b.stats.roas || 0) - (a.stats.roas || 0);
  });
  const topCampaigns = ranked.slice(0, 5).map(({ campaign, stats }) => ({ campaign, stats }));
  const needsAttention = withStats
    .filter(({ campaign, stats }) => campaign.spend >= MIN_REVIEW_SPEND && stats.qualifiedLeads === 0)
    .sort((a, b) => b.campaign.spend - a.campaign.spend)
    .slice(0, 5)
    .map(({ campaign, stats }) => ({ campaign, stats }));

  res.json({
    success: true,
    data: {
      totals,
      blended,
      byChannel: Object.values(byChannel),
      funnel: {
        leads: totals.leads,
        qualifiedLeads: totals.qualifiedLeads,
        applications: totals.applications,
        deposits: totals.deposits,
        enrolments: totals.enrolments,
      },
      topCampaigns,
      needsAttention,
      campaignCount: campaigns.length,
      activeCampaignCount: campaigns.filter((c) => c.status === 'Active').length,
    },
  });
});

module.exports = { getCampaigns, getCampaignById, createCampaign, updateCampaign, deleteCampaign, getOverview };
