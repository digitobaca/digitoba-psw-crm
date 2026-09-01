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

  // Funnel counts per the spec's TOTAL LEADS / QUALIFIED / COUNSELLING / ... rows.
  const funnel = {
    totalLeads: totalStudents,
    qualifiedLeads: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Qualified'))),
    counselling: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Counselling'))),
    applications: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Application'))),
    offers: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Offer'))),
    deposits: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Deposit'))),
    visas: countByStages(Student.PIPELINE_STAGES.slice(Student.PIPELINE_STAGES.indexOf('Visa'))),
    enrolments: stageMap['Student in Canada'] || 0,
  };

  // Stage-to-stage conversion percentages.
  const pct = (num, den) => (den > 0 ? Math.round((num / den) * 1000) / 10 : 0);
  const conversion = {
    leadToApplicationPct: pct(funnel.applications, funnel.totalLeads),
    applicationToOfferPct: pct(funnel.offers, funnel.applications),
    offerToEnrolmentPct: pct(funnel.enrolments, funnel.offers),
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
