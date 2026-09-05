const { body, param, query, validationResult } = require('express-validator');
const FeeProgram = require('../models/FeeProgram');
const FeePartner = require('../models/FeePartner');
const FeeStudent = require('../models/FeeStudent');
const FeeRefund = require('../models/FeeRefund');

/**
 * Same ~10-line pattern as server/middleware/validators.js#validate, kept
 * local per the module's isolation rule (constraint #1) rather than
 * importing the shared file (which itself doesn't export `validate` for
 * standalone reuse — checked, it's only used internally there).
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    return res.json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const idParamRule = [param('id').isMongoId().withMessage('Invalid id')];

// --- Programs ------------------------------------------------------------------------
const feeLineRules = body('feeLines').optional().isArray().withMessage('feeLines must be an array');
const instalmentTemplateRules = body('instalmentTemplate').optional().isArray().withMessage('instalmentTemplate must be an array');

const programCreateRules = [
  body('code').trim().notEmpty().withMessage('Program code is required').isLength({ max: 20 }),
  body('name').trim().notEmpty().withMessage('Program name is required').isLength({ max: 200 }),
  body('type').isIn(FeeProgram.TYPES).withMessage('Invalid program type'),
  body('hoursTotal').isInt({ min: 1 }).withMessage('hoursTotal must be a positive integer'),
  body('totalCents').isInt({ min: 0 }).withMessage('totalCents must be a non-negative integer'),
  body('selfFundingCents').isInt({ min: 0 }).withMessage('selfFundingCents must be a non-negative integer'),
  body('intlSurchargeCents').optional().isInt({ min: 0 }),
  body('clearBeforeDays').optional({ nullable: true }).isInt({ min: 0 }),
  feeLineRules,
  instalmentTemplateRules,
];

const programUpdateRules = [...idParamRule, ...programCreateRules.map((r) => r)];

// --- Partners --------------------------------------------------------------------------
const partnerCreateRules = [
  body('name').trim().notEmpty().withMessage('Partner name is required').isLength({ max: 200 }),
  body('tier').isIn(FeePartner.TIERS).withMessage('Invalid tier'),
  body('commissionRatePct').isFloat({ min: 0, max: 100 }).withMessage('commissionRatePct must be 0-100'),
  body('remitWindowDays').optional().isInt({ min: 1 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
];

const partnerUpdateRules = [...idParamRule, ...partnerCreateRules];

// --- Students --------------------------------------------------------------------------
const studentQueryRules = [
  query('filter').optional().isIn(['all', 'new', 'agent', 'bjo', 'overdue', 'direct']),
  query('q').optional().trim().isLength({ max: 200 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

const studentCreateRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('phone').optional({ checkFalsy: true }).isLength({ max: 30 }),
  body('programId').isMongoId().withMessage('A valid program id is required'),
  body('fundingType').isIn(FeeStudent.FUNDING_TYPES).withMessage('Invalid funding type'),
  body('partnerId').optional({ nullable: true }).isMongoId(),
  body('cohortStart').notEmpty().withMessage('Cohort start date is required').isISO8601(),
  body('leadId').optional({ nullable: true }).isMongoId(),
  body('applicationId').optional({ nullable: true }).isMongoId(),
];

const planPreviewRules = [
  query('programId').isMongoId().withMessage('A valid program id is required'),
  query('fundingType').isIn(FeeStudent.FUNDING_TYPES).withMessage('Invalid funding type'),
  query('cohortStart').notEmpty().withMessage('Cohort start date is required').isISO8601(),
];

const instalmentParamRules = [param('id').isMongoId().withMessage('Invalid student id'), param('idx').isInt({ min: 0 }).toInt()];

const logReceiptRules = [
  ...instalmentParamRules,
  body('amountCents').isInt({ min: 0 }).withMessage('amountCents must be a non-negative integer'),
  body('date').optional().isISO8601(),
];

const recordDirectRules = [
  ...instalmentParamRules,
  body('amountCents').isInt({ min: 0 }).withMessage('amountCents must be a non-negative integer'),
  body('date').optional().isISO8601(),
];

// --- Batches ---------------------------------------------------------------------------
const batchCreateRules = [
  body('partnerId').isMongoId().withMessage('A valid partner id is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one instalment is required'),
  body('items.*.studentId').isMongoId().withMessage('Invalid studentId in items'),
  body('items.*.instalmentIndex').isInt({ min: 0 }).withMessage('Invalid instalmentIndex in items'),
  body('wireRef').trim().notEmpty().withMessage('A wire reference is required'),
  body('sentOn').notEmpty().withMessage('Sent date is required').isISO8601(),
];

const batchRefParamRules = [param('ref').trim().notEmpty().withMessage('A batch reference is required')];

// --- Refunds -----------------------------------------------------------------------------
const refundBodyRules = [
  body('studentId').isMongoId().withMessage('A valid student id is required'),
  body('noticeDate').notEmpty().withMessage('Notice date is required').isISO8601(),
  body('reason').isIn(FeeRefund.REASONS).withMessage('Invalid refund reason'),
  body('hoursDelivered').optional().isFloat({ min: 0 }),
  body('booksReturned').optional().isBoolean().toBoolean(),
];

module.exports = {
  validate,
  idParamRule,
  programCreateRules,
  programUpdateRules,
  partnerCreateRules,
  partnerUpdateRules,
  studentQueryRules,
  studentCreateRules,
  planPreviewRules,
  instalmentParamRules,
  logReceiptRules,
  recordDirectRules,
  batchCreateRules,
  batchRefParamRules,
  refundBodyRules,
};
