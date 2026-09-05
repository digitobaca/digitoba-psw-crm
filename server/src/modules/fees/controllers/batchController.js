const asyncHandler = require('express-async-handler');
const FeeRemittanceBatch = require('../models/FeeRemittanceBatch');
const FeeStudent = require('../models/FeeStudent');
const FeePartner = require('../models/FeePartner');
const FeeLedgerEvent = require('../models/FeeLedgerEvent');
const transitions = require('../services/transitions');
const { nextSeq, nextRcpt } = require('../services/sequence');
const { applyHttpError } = require('./helpers');

async function logEvent(event, { partnerId = null, batchId = null, ctx }) {
  await FeeLedgerEvent.create({ ...event, studentId: null, partnerId, batchId, actorId: ctx.actorId, actorRole: ctx.role });
}

/** Generates the next "<PARTNER-INITIALS>-<year>-<seq>" style batch ref, e.g. "MC-2026-07". */
async function nextBatchRef(partner, now) {
  const initials = partner.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 3);
  const seq = await nextSeq(`batch-${partner._id}-${now.getFullYear()}`);
  return `${initials}-${now.getFullYear()}-${String(seq).padStart(2, '0')}`;
}

/** @desc List remittance batches, scoped by role. @route GET /api/fees/batches */
const getBatches = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'partner' ? { partnerId: req.user.partnerId } : {};
  const batches = await FeeRemittanceBatch.find(filter).populate('partnerId', 'name city').sort({ createdAt: -1 });
  res.json({ success: true, data: batches });
});

/** @desc Create a remittance batch from held instalments. @route POST /api/fees/batches @access partner/registrar */
const createBatch = asyncHandler(async (req, res) => {
  const { partnerId, items, wireRef, sentOn } = req.body;

  if (req.user.role === 'partner' && String(partnerId) !== String(req.user.partnerId)) {
    res.status(403);
    throw new Error('You can only remit your own students.');
  }

  const partner = await FeePartner.findById(partnerId);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }

  const studentIds = [...new Set(items.map((i) => i.studentId))];
  const students = await FeeStudent.find({ _id: { $in: studentIds } });
  const byId = new Map(students.map((s) => [String(s._id), s]));

  const resolvedItems = items.map((i) => {
    const student = byId.get(String(i.studentId));
    if (!student) {
      res.status(404);
      throw new Error(`Student ${i.studentId} not found`);
    }
    return { student, instalmentIndex: i.instalmentIndex };
  });

  const batchRef = await nextBatchRef(partner, req.feeCtx.now);

  let result;
  try {
    result = transitions.createBatch(resolvedItems, { partnerId, batchRef }, req.feeCtx);
  } catch (err) {
    applyHttpError(res, err);
  }

  await Promise.all(students.map((s) => s.save()));

  const batch = await FeeRemittanceBatch.create({
    ref: batchRef,
    partnerId,
    items: result.batchItems,
    amountCents: result.amountCents,
    wireRef,
    sentOn,
    status: 'pending',
    createdBy: req.user._id,
  });

  await logEvent(result.event, { partnerId, batchId: batch._id, ctx: req.feeCtx });

  res.status(201).json({ success: true, data: batch });
});

/** @desc Confirm a whole pending batch — clears every item and lets commission accrue. @route POST /api/fees/batches/:ref/confirm @access registrar/admin */
const confirmBatch = asyncHandler(async (req, res) => {
  const batch = await FeeRemittanceBatch.findOne({ ref: req.params.ref });
  if (!batch) {
    res.status(404);
    throw new Error('Batch not found');
  }

  const studentIds = batch.items.map((i) => i.studentId);
  const students = await FeeStudent.find({ _id: { $in: studentIds } });

  let event;
  try {
    const rcptRef = await nextRcpt();
    event = transitions.confirmBatch(batch, students, { rcptRef }, req.feeCtx);
  } catch (err) {
    applyHttpError(res, err);
  }

  await Promise.all(students.map((s) => s.save()));
  await batch.save();
  await logEvent(event, { partnerId: batch.partnerId, batchId: batch._id, ctx: req.feeCtx });

  res.json({ success: true, data: batch });
});

module.exports = { getBatches, createBatch, confirmBatch };
