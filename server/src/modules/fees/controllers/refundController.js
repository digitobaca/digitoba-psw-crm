const asyncHandler = require('express-async-handler');
const FeeRefund = require('../models/FeeRefund');
const FeeStudent = require('../models/FeeStudent');
const FeePartner = require('../models/FeePartner');
const FeeLedgerEvent = require('../models/FeeLedgerEvent');
const sums = require('../services/sums');
const refundCalc = require('../services/refundCalc');
const transitions = require('../services/transitions');
const { applyHttpError } = require('./helpers');

/** Resolves the shared inputs refundCalc needs from a student + its program + its partner. */
async function resolveRefundInputs(studentId, now) {
  const student = await FeeStudent.findById(studentId).populate('programId').populate('partnerId');
  if (!student) return { student: null };

  const { clearedCents } = sums(student.instalments, now);
  const program = student.programId;
  const booksLine = (program.feeLines || []).find((l) => /books/i.test(l.label));

  return {
    student,
    program,
    inputs: {
      paidCents: clearedCents,
      programFeesCents: program.totalCents,
      hoursTotal: program.hoursTotal,
      booksCostCents: booksLine ? booksLine.amountCents : 0,
      commissionRatePct: student.partnerId ? student.partnerId.commissionRatePct : 0,
    },
  };
}

/** @desc List approved refunds. @route GET /api/fees/refunds */
const getRefunds = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'partner' ? { partnerId: req.user.partnerId } : {};
  const refunds = await FeeRefund.find(filter).populate('studentId', 'sid name').populate('partnerId', 'name').sort({ createdAt: -1 });
  res.json({ success: true, data: refunds });
});

/** @desc Refund calculator preview — no write. @route POST /api/fees/refunds/preview */
const previewRefund = asyncHandler(async (req, res) => {
  const { studentId, noticeDate, reason, hoursDelivered = 0, booksReturned = false } = req.body;
  const { student, inputs } = await resolveRefundInputs(studentId, req.feeCtx.now);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const result = refundCalc({
    ...inputs,
    hoursDelivered: Number(hoursDelivered),
    reason,
    booksReturned: !!booksReturned,
    noticeDate,
  });

  res.json({ success: true, data: result });
});

/** @desc Approve a refund — cancels remaining unpaid instalments and stores the withdrawal. @route POST /api/fees/refunds @access registrar/admin */
const approveRefund = asyncHandler(async (req, res) => {
  const { studentId, noticeDate, reason, hoursDelivered = 0, booksReturned = false } = req.body;
  const { student, program, inputs } = await resolveRefundInputs(studentId, req.feeCtx.now);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const calc = refundCalc({
    ...inputs,
    hoursDelivered: Number(hoursDelivered),
    reason,
    booksReturned: !!booksReturned,
    noticeDate,
  });

  let event;
  try {
    event = transitions.approveRefund(student, { noticeDate, reason, refundCents: calc.refundCents, clawbackCents: calc.clawbackCents }, req.feeCtx);
  } catch (err) {
    applyHttpError(res, err);
  }

  await student.save();

  const refund = await FeeRefund.create({
    studentId: student._id,
    programName: program.name,
    partnerId: student.partnerId || null,
    noticeDate,
    reason,
    hoursDelivered,
    booksReturned: !!booksReturned,
    paidCents: inputs.paidCents,
    serviceFeeCents: calc.serviceFeeCents,
    earnedCents: calc.earnedCents,
    booksCents: calc.booksCents,
    refundCents: calc.refundCents,
    clawbackCents: calc.clawbackCents,
    dueBy: calc.dueBy,
    status: 'approved',
    approvedBy: req.user._id,
  });

  await FeeLedgerEvent.create({ ...event, studentId: student._id, partnerId: student.partnerId || null, actorId: req.feeCtx.actorId, actorRole: req.feeCtx.role });

  res.status(201).json({ success: true, data: { refund, student } });
});

module.exports = { getRefunds, previewRefund, approveRefund };
