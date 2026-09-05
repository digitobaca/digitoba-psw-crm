const asyncHandler = require('express-async-handler');
const FeeStudent = require('../models/FeeStudent');
const FeePartner = require('../models/FeePartner');
const FeeLedgerEvent = require('../models/FeeLedgerEvent');
const FeeRefund = require('../models/FeeRefund');
const effectiveStatus = require('../services/effectiveStatus');
const sums = require('../services/sums');
const commission = require('../services/commission');
const computeAlerts = require('../services/alerts');

/** Stacked-bar buckets (cleared / held / bjo / overdue / notYetDue / direct-outlined) across a set of students. */
function stackedBar(students, now) {
  const bucket = { clearedCents: 0, heldCents: 0, bjoCents: 0, overdueCents: 0, notYetDueCents: 0, directCents: 0 };
  students.forEach((student) => {
    student.instalments.forEach((inst) => {
      if (inst.cancelled) return;
      const status = effectiveStatus(inst, now);
      const amount = inst.reportedCents != null && (status === 'agent' || status === 'transit') ? inst.reportedCents : inst.amountCents;
      if (inst.channel === 'direct' && status === 'cleared') bucket.directCents += amount;
      if (status === 'cleared') bucket.clearedCents += amount;
      else if (status === 'agent' || status === 'transit') bucket.heldCents += amount;
      else if (status === 'funder') bucket.bjoCents += amount;
      else if (status === 'overdue') bucket.overdueCents += amount;
      else if (status === 'due') bucket.notYetDueCents += amount;
    });
  });
  return bucket;
}

/** @desc Summary tiles + stacked-bar numbers for the current role scope. @route GET /api/fees/summary */
const getSummary = asyncHandler(async (req, res) => {
  const now = req.feeCtx.now;
  const students = await FeeStudent.find(req.feeScope);
  const totals = students.reduce(
    (acc, s) => {
      const t = sums(s.instalments, now);
      acc.totalCents += t.totalCents;
      acc.clearedCents += t.clearedCents;
      acc.heldCents += t.heldCents;
      acc.funderCents += t.funderCents;
      acc.outstandingCents += t.outstandingCents;
      acc.overdueCents += t.overdueCents;
      return acc;
    },
    { totalCents: 0, clearedCents: 0, heldCents: 0, funderCents: 0, outstandingCents: 0, overdueCents: 0 }
  );

  const bar = stackedBar(students, now);
  const studentCount = students.length;

  const data = {
    studentCount,
    programCount: new Set(students.map((s) => String(s.programId))).size,
    partnerCount: new Set(students.filter((s) => s.partnerId).map((s) => String(s.partnerId))).size,
    totals,
    bar,
  };

  if (req.user.role === 'partner') {
    const partner = await FeePartner.findById(req.user.partnerId);
    const refunds = await FeeRefund.find({ partnerId: req.user.partnerId });
    data.partner = partner ? { name: partner.name, tier: partner.tier, commissionRatePct: partner.commissionRatePct } : null;
    data.commission = partner ? commission(partner, students, refunds, now) : null;
  }

  res.json({ success: true, data });
});

/** @desc Action queue for the current role scope. @route GET /api/fees/alerts */
const getAlerts = asyncHandler(async (req, res) => {
  const students = await FeeStudent.find(req.feeScope);
  const partners = await FeePartner.find();
  const partnersById = new Map(partners.map((p) => [String(p._id), p]));
  const alerts = computeAlerts(students, { role: req.user.role, partnersById, now: req.feeCtx.now });
  res.json({ success: true, data: alerts });
});

/** @desc Ledger events for the current role scope. @route GET /api/fees/feed?limit=40 */
const getFeed = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 40, 200);
  let filter = {};

  if (req.user.role === 'partner') {
    filter = { partnerId: req.user.partnerId };
  } else if (req.user.role === 'counsellor') {
    const scopedStudents = await FeeStudent.find(req.feeScope).select('_id');
    filter = { studentId: { $in: scopedStudents.map((s) => s._id) } };
  }

  const events = await FeeLedgerEvent.find(filter).sort({ createdAt: -1 }).limit(limit).populate('actorId', 'name role');
  res.json({ success: true, data: events });
});

module.exports = { getSummary, getAlerts, getFeed };
