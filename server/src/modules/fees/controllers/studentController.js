const asyncHandler = require('express-async-handler');
const FeeStudent = require('../models/FeeStudent');
const FeeProgram = require('../models/FeeProgram');
const FeePartner = require('../models/FeePartner');
const FeeLedgerEvent = require('../models/FeeLedgerEvent');
const { buildPlan } = require('../services/buildPlan');
const effectiveStatus = require('../services/effectiveStatus');
const transitions = require('../services/transitions');
const { nextSid, nextRcpt, nextMtcu } = require('../services/sequence');
const { assertStudentInScope } = require('../middleware/feeScope');
const { serializeStudent, applyHttpError } = require('./helpers');

/** Writes a FeeLedgerEvent from a transition's returned event descriptor. */
async function logEvent(event, { studentId = null, partnerId = null, batchId = null, ctx }) {
  await FeeLedgerEvent.create({
    ...event,
    studentId,
    partnerId,
    batchId,
    actorId: ctx.actorId,
    actorRole: ctx.role,
  });
}

/** In-memory classification used by the `filter` query param — small dataset, not worth a Mongo aggregation pipeline. */
function matchesFilter(student, filter, now) {
  if (!filter || filter === 'all') return true;
  const statuses = student.instalments.filter((i) => !i.cancelled).map((i) => effectiveStatus(i, now));
  switch (filter) {
    case 'new':
      return statuses.every((s) => s === 'due' || s === 'overdue');
    case 'agent':
      return statuses.some((s) => s === 'agent' || s === 'transit');
    case 'bjo':
      return student.fundingType === 'bjo';
    case 'overdue':
      return statuses.some((s) => s === 'overdue');
    case 'direct':
      return student.fundingType === 'self' || student.instalments.some((i) => i.channel === 'direct');
    default:
      return true;
  }
}

/** @desc List fee students, scoped by role. @route GET /api/fees/students */
const getStudents = asyncHandler(async (req, res) => {
  const now = req.feeCtx.now;
  const { filter, q, page = 1, limit = 20 } = req.query;

  const mongoFilter = { ...req.feeScope };
  if (q) {
    mongoFilter.$or = [{ name: new RegExp(q, 'i') }, { sid: new RegExp(q, 'i') }, { email: new RegExp(q, 'i') }];
  }

  const all = await FeeStudent.find(mongoFilter)
    .populate('programId', 'name code')
    .populate('partnerId', 'name city tier commissionRatePct')
    .sort({ createdAt: -1 });

  const filtered = all.filter((s) => matchesFilter(s, filter, now));
  const start = (page - 1) * limit;
  const paged = filtered.slice(start, start + Number(limit));

  res.json({
    success: true,
    data: paged.map((s) => serializeStudent(s, now)),
    pagination: { page: Number(page), limit: Number(limit), total: filtered.length, pages: Math.ceil(filtered.length / limit) },
  });
});

/** @desc Pure preview of a generated instalment plan — no write. @route GET /api/fees/students/plan-preview */
const planPreview = asyncHandler(async (req, res) => {
  const { programId, fundingType, cohortStart } = req.query;
  const program = await FeeProgram.findById(programId);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  if (fundingType === 'intl' && req.query.partnerId) {
    const partner = await FeePartner.findById(req.query.partnerId);
    if (!partner) {
      res.status(404);
      throw new Error('Partner not found');
    }
  }

  try {
    const instalments = buildPlan(program, fundingType, cohortStart);
    const totalCents = instalments.reduce((sum, i) => sum + i.amountCents, 0);
    res.json({ success: true, data: { instalments, totalCents } });
  } catch (err) {
    applyHttpError(res, err);
  }
});

/** @desc Create a fee student + generated plan. @route POST /api/fees/students @access registrar/admin */
const createStudent = asyncHandler(async (req, res) => {
  const { name, email, phone, programId, fundingType, partnerId, cohortStart, leadId, applicationId } = req.body;

  const program = await FeeProgram.findById(programId);
  let partner = null;
  if (partnerId) partner = await FeePartner.findById(partnerId);

  let event;
  try {
    event = transitions.createStudent({ programId, program, fundingType, partnerId: partnerId || null }, req.feeCtx);
  } catch (err) {
    applyHttpError(res, err);
  }
  if (fundingType === 'intl' && !partner) {
    res.status(400);
    throw new Error('Recruiting partner not found.');
  }

  const instalments = buildPlan(program, fundingType, cohortStart);
  const sid = await nextSid(req.feeCtx.now);

  const student = await FeeStudent.create({
    sid,
    name,
    email: email || '',
    phone: phone || '',
    leadId: leadId || null,
    applicationId: applicationId || null,
    programId,
    fundingType,
    partnerId: fundingType === 'intl' ? partnerId : null,
    cohortStart,
    instalments,
    createdBy: req.user._id,
  });

  await logEvent(event, { studentId: student._id, partnerId: student.partnerId, ctx: req.feeCtx });

  res.status(201).json({ success: true, data: serializeStudent(student, req.feeCtx.now) });
});

/** @desc Full ledger for one student: instalments + sums + history. @route GET /api/fees/students/:id */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await FeeStudent.findById(req.params.id).populate('programId').populate('partnerId', 'name city phone email tier commissionRatePct');
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  try {
    await assertStudentInScope(req, student);
  } catch (err) {
    applyHttpError(res, err);
  }

  const history = await FeeLedgerEvent.find({ studentId: student._id }).sort({ createdAt: -1 }).populate('actorId', 'name role');

  res.json({ success: true, data: { ...serializeStudent(student, req.feeCtx.now), history } });
});

/** Shared plumbing for the four instalment-action endpoints below. */
async function runInstalmentAction(req, res, transitionFn, buildParams) {
  const student = await FeeStudent.findById(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  try {
    await assertStudentInScope(req, student);
    const params = await buildParams(student);
    const event = transitionFn(student, req.params.idx, params, req.feeCtx);
    await student.save();
    await logEvent(event, { studentId: student._id, partnerId: student.partnerId, ctx: req.feeCtx });
    res.json({ success: true, data: serializeStudent(student, req.feeCtx.now) });
  } catch (err) {
    applyHttpError(res, err);
  }
}

/** @desc partner/registrar logs a receipt they collected. @route POST /api/fees/students/:id/instalments/:idx/log-receipt */
const logReceipt = asyncHandler((req, res) =>
  runInstalmentAction(req, res, transitions.logReceipt, async () => ({
    amountCents: req.body.amountCents,
    date: req.body.date || req.feeCtx.now,
  }))
);

/** @desc registrar confirms cash landed. @route POST /api/fees/students/:id/instalments/:idx/confirm */
const confirmReceipt = asyncHandler((req, res) =>
  runInstalmentAction(req, res, transitions.confirmReceipt, async () => ({
    rcptRef: await nextRcpt(),
    mtcuRef: await nextMtcu(req.feeCtx.now),
  }))
);

/** @desc registrar records a student who paid the college directly. @route POST /api/fees/students/:id/instalments/:idx/record-direct */
const recordDirect = asyncHandler((req, res) =>
  runInstalmentAction(req, res, transitions.recordDirect, async () => ({
    amountCents: req.body.amountCents,
    date: req.body.date || req.feeCtx.now,
    rcptRef: await nextRcpt(),
  }))
);

/** @desc registrar submits a BJO instalment as a ministry claim. @route POST /api/fees/students/:id/instalments/:idx/submit-claim */
const submitClaim = asyncHandler((req, res) => runInstalmentAction(req, res, transitions.submitClaim, async () => undefined));

module.exports = { getStudents, planPreview, createStudent, getStudentById, logReceipt, confirmReceipt, recordDirect, submitClaim };
