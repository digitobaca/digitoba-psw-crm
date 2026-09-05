const asyncHandler = require('express-async-handler');
const Student = require('../../../../models/Student'); // existing CRM lead-pipeline model
const HttpError = require('../utils/HttpError');

/**
 * Builds `req.feeScope` — a Mongoose filter for FeeStudent queries — and
 * `req.feeCtx` — the role/actor context every service transition needs.
 * Must run after `protect`. Mirrors the existing scopeToCounsellor pattern
 * (server/middleware/auth.js) but is kept local to the fees module per the
 * isolation rule (constraint #1).
 *
 * - admin / registrar: see everything (`{}` filter), full read-write.
 * - partner: `{ partnerId: req.user.partnerId }` — only their own students.
 * - counsellor: read-only, scoped to fee students whose `leadId` is one of
 *   their assigned CRM leads.
 * - anything else (including a portal session, which never reaches here
 *   because it carries no valid staff JWT) is rejected.
 */
const feeScope = asyncHandler(async (req, res, next) => {
  const role = req.user?.role;

  if (role === 'admin' || role === 'registrar') {
    req.feeScope = {};
  } else if (role === 'partner') {
    if (!req.user.partnerId) {
      res.status(403);
      throw new Error('This partner account is not linked to a recruitment partner record.');
    }
    req.feeScope = { partnerId: req.user.partnerId };
  } else if (role === 'counsellor') {
    const leads = await Student.find({ assignedCounsellor: req.user._id }).select('_id');
    req.feeScope = { leadId: { $in: leads.map((l) => l._id) } };
  } else {
    res.status(403);
    throw new Error('You do not have permission to access the fee ledger.');
  }

  req.feeCtx = {
    role,
    partnerId: req.user.partnerId || null,
    actorId: req.user._id,
    now: new Date(),
  };

  next();
});

/** Registrar/admin-only write actions (create/update programs & partners, confirm cash, etc). */
const requireRegistrar = (req, res, next) => {
  if (!['admin', 'registrar'].includes(req.user?.role)) {
    res.status(403);
    throw new HttpError(403, 'This action is restricted to registrar/admin.');
  }
  next();
};

/** Used by single-student endpoints to turn "not in my scope" into a 403 rather than a leaky 404. */
async function assertStudentInScope(req, student) {
  const role = req.user.role;
  if (role === 'admin' || role === 'registrar') return;
  if (role === 'partner') {
    if (String(student.partnerId) !== String(req.user.partnerId)) {
      throw new HttpError(403, 'You can only view your own students.');
    }
    return;
  }
  if (role === 'counsellor') {
    if (!student.leadId) throw new HttpError(403, 'You can only view students linked to your assigned leads.');
    const lead = await Student.findOne({ _id: student.leadId, assignedCounsellor: req.user._id }).select('_id');
    if (!lead) throw new HttpError(403, 'You can only view students linked to your assigned leads.');
    return;
  }
  throw new HttpError(403, 'You do not have permission to access the fee ledger.');
}

module.exports = { feeScope, requireRegistrar, assertStudentInScope };
