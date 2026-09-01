const { body, param, query, validationResult } = require('express-validator');
const Student = require('../models/Student');
const AdCampaign = require('../models/AdCampaign');

/** Runs after a chain of express-validator checks; 400s with details on failure. */
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

const adCampaignRules = [
  body('name').trim().notEmpty().withMessage('Campaign name is required').isLength({ max: 150 }),
  body('channel').isIn(AdCampaign.CHANNELS).withMessage('Invalid channel'),
  body('platform').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('program').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('objective').optional({ checkFalsy: true }).isIn(AdCampaign.OBJECTIVES),
  body('status').optional({ checkFalsy: true }).isIn(AdCampaign.STATUSES),
  body('startDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('endDate').optional({ nullable: true, checkFalsy: true }).isISO8601(),
  body('spend').optional().isFloat({ min: 0 }),
  body('impressions').optional().isInt({ min: 0 }),
  body('clicks').optional().isInt({ min: 0 }),
  body('adLink').optional({ checkFalsy: true }).trim().isLength({ max: 500 }),
  body('utmSlug')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 100 })
    .matches(/^[a-z0-9-_]+$/i)
    .withMessage('utm_campaign should only contain letters, numbers, hyphens, and underscores'),
  body('decision').optional({ checkFalsy: true }).isIn(AdCampaign.DECISIONS),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
];

const deletionRequestRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 30 }),
  body('reason').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }),
];

// --- Students (public lead capture + CRM updates) ---------------------------------
const studentCreateRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Phone number is required').isLength({ max: 30 }),
  body('country').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('city').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('education').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('intendedProgram').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
  body('preferredProvince').optional({ checkFalsy: true }).trim().isLength({ max: 100 }),
  body('message').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('leadSource').optional({ checkFalsy: true }).isIn(Student.LEAD_SOURCES),
  body('immigrationStatus').optional({ checkFalsy: true }).isIn(Student.IMMIGRATION_STATUSES),
  body('utmCampaign').optional({ checkFalsy: true }).trim().isLength({ max: 150 }),
];

const studentUpdateRules = [
  param('id').isMongoId().withMessage('Invalid student id'),
  body('pipelineStage').optional().isIn([...Student.PIPELINE_STAGES, Student.CLOSED_STAGE]),
  body('leadSource').optional().isIn(Student.LEAD_SOURCES),
  body('immigrationStatus').optional({ checkFalsy: true }).isIn(Student.IMMIGRATION_STATUSES),
  body('campaign').optional({ nullable: true }).isMongoId(),
  body('notes').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }),
  body('name').optional().trim().isLength({ max: 100 }),
  body('email').optional().trim().isEmail().normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('assignedCounsellor').optional({ nullable: true }).isMongoId(),
];

const studentQueryRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('pipelineStage').optional().isIn([...Student.PIPELINE_STAGES, Student.CLOSED_STAGE]),
  query('leadSource').optional().isIn(Student.LEAD_SOURCES),
];

const noteRules = [
  param('id').isMongoId(),
  body('text').trim().notEmpty().withMessage('Note text is required').isLength({ max: 2000 }),
];

// --- Auth ------------------------------------------------------------------------------
const loginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const portalLoginRules = [
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Never required here — logout must never get someone stuck unable to sign
// out — just capped so it can't be abused as a huge payload.
const logoutRules = [body('summary').optional({ checkFalsy: true }).trim().isLength({ max: 2000 })];

// --- Colleges / Programs ----------------------------------------------------------------
const collegeCreateRules = [
  body('name').trim().notEmpty().withMessage('College name is required').isLength({ max: 200 }),
  body('province').trim().notEmpty().withMessage('Province is required'),
];

const programCreateRules = [
  body('college').isMongoId().withMessage('A valid college id is required'),
  body('name').trim().notEmpty().withMessage('Program name is required').isLength({ max: 200 }),
  body('level').isIn(['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD', 'PSW Certificate']),
];

// --- Applications ------------------------------------------------------------------------
const applicationCreateRules = [
  body('student').isMongoId().withMessage('A valid student id is required'),
  body('college').isMongoId().withMessage('A valid college id is required'),
  body('program').isMongoId().withMessage('A valid program id is required'),
];

// --- Tasks -------------------------------------------------------------------------------
const taskCreateRules = [
  body('student').isMongoId().withMessage('A valid student id is required'),
  body('assignedTo').isMongoId().withMessage('A valid counsellor id is required'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 500 }),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601(),
];

// --- Payments -----------------------------------------------------------------------------
const paymentCreateRules = [
  body('student').isMongoId().withMessage('A valid student id is required'),
  body('type').isIn(['Application Fee', 'Tuition Deposit', 'Service Fee', 'Other']),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
];

// --- Attendance -----------------------------------------------------------------------------
const attendanceQueryRules = [
  query('user').optional().isMongoId(),
  query('status').optional().isIn(['Active', 'Completed']),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 5000 }).toInt(),
];

// --- Communications -------------------------------------------------------------------------
const communicationCreateRules = [
  body('student').isMongoId().withMessage('A valid student id is required'),
  body('channel').isIn(['Email', 'WhatsApp', 'SMS', 'Call', 'Note']),
  body('contactStatus').optional({ nullable: true }).isIn(['Contacted', 'Not Contacted', 'No Response']),
  body('message').trim().isLength({ max: 4000 }),
  // Message is required for every normal log (WhatsApp/Email/Call/Note) and
  // for a "Contacted" quick-log — there's just nothing to say for a failed
  // or unanswered contact attempt, so those two skip the requirement.
  body('message').custom((value, { req }) => {
    const skippable = ['Not Contacted', 'No Response'].includes(req.body.contactStatus);
    if (!skippable && !value?.trim()) {
      throw new Error('Message/notes are required');
    }
    return true;
  }),
];

module.exports = {
  validate,
  idParamRule,
  deletionRequestRules,
  adCampaignRules,
  studentCreateRules,
  studentUpdateRules,
  studentQueryRules,
  noteRules,
  loginRules,
  portalLoginRules,
  logoutRules,
  collegeCreateRules,
  programCreateRules,
  applicationCreateRules,
  taskCreateRules,
  paymentCreateRules,
  communicationCreateRules,
  attendanceQueryRules,
};
