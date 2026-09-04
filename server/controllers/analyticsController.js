const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const User = require('../models/User');

/**
 * @desc    Admin-wide CRM overview: pipeline funnel, conversion rates,
 *          revenue, and breakdowns by source/counsellor/country/program.
 *
 *          Note on "Google Ads ROI / Meta Ads ROI" from the spec: computing
 *          real ROI needs ad-spend data from those platforms, which isn't
 *          connected yet (no ad account credentials configured). Rather than
 *          fabricate a number, this returns lead/conversion counts *by
 *          source* — plug in actual spend once Google Ads/Meta Ads API
 *          access is set up, and ROI = (revenue from that source) / spend.
 * @route   GET /api/analytics/overview
 * @access  Private (admin)
 */
const getOverview = asyncHandler(async (req, res) => {
  const [
    totalStudents,
    stageBreakdown,
    sourceBreakdown,
    countryBreakdown,
    counsellorBreakdown,
    applicationsByStage,
    revenueAgg,
    counsellors,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.aggregate([{ $group: { _id: '$pipelineStage', count: { $sum: 1 } } }]),
    Student.aggregate([{ $group: { _id: '$leadSource', count: { $sum: 1 } } }]),
    Student.aggregate([
      { $match: { country: { $ne: '' } } },
      { $group: { _id: '$country', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Student.aggregate([
      { $match: { assignedCounsellor: { $ne: null } } },
      { $group: { _id: '$assignedCounsellor', count: { $sum: 1 } } },
    ]),
    Application.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
    Payment.aggregate([
      { $match: { status: 'Paid' } },
      { $group: { _id: '$currency', total: { $sum: '$amount' } } },
    ]),
    User.find({ role: 'counsellor' }).select('name email activeStudentCount'),
  ]);

  const stageMap = Object.fromEntries(stageBreakdown.map((s) => [s._id, s.count]));
  const countByStages = (stages) => stages.reduce((sum, s) => sum + (stageMap[s] || 0), 0);
  // Cumulative "reached this stage or further" count, using PIPELINE_STAGES'
  // forward order — same technique adCampaignController uses per-campaign.
  const countFrom = (stage) => countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf(stage)));

  // Funnel counts through the forward lead-qualification pipeline.
  const funnel = {
    totalLeads: totalStudents,
    coldAttempted: countFrom('Cold Attempt 1'),
    warmLeads: countFrom('Warm Lead'),
    hotLeads: countFrom('Hot Lead'),
    interested: countFrom('Interested'),
    enrolled: stageMap['Enrolled'] || 0,
  };

  // Side/terminal outcomes — not forward progress, reported separately so
  // they don't distort the funnel bars above.
  const outcomes = {
    notInterested: stageMap['Not Interested'] || 0,
    counselledNotEnrolled: stageMap['Counselled Not Enrolled'] || 0,
    holdLead: stageMap['Hold Lead'] || 0,
    bjo: stageMap['BJO'] || 0,
  };

  // Stage-to-stage conversion percentages.
  const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);
  const conversion = {
    leadToWarmPct: pct(funnel.warmLeads, funnel.totalLeads),
    warmToInterestedPct: pct(funnel.interested, funnel.warmLeads),
    interestedToEnrolledPct: pct(funnel.enrolled, funnel.interested),
  };

  const counsellorMap = Object.fromEntries(counsellors.map((c) => [String(c._id), c]));
  const counsellorConversion = counsellorBreakdown.map((c) => ({
    counsellor: counsellorMap[String(c._id)] || { name: 'Unknown' },
    assignedStudents: c.count,
  }));

  res.json({
    success: true,
    data: {
      funnel,
      outcomes,
      conversion,
      leadsBySource: sourceBreakdown.map((s) => ({ source: s._id, count: s.count })),
      leadsByCountry: countryBreakdown.map((c) => ({ country: c._id, count: c.count })),
      applicationsByStage: applicationsByStage.map((a) => ({ stage: a._id, count: a.count })),
      revenueByCurrency: revenueAgg.map((r) => ({ currency: r._id, total: r.total })),
      counsellorConversion,
    },
  });
});

module.exports = { getOverview };
