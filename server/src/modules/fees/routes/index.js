const express = require('express');
const { protect, authorize } = require('../../../../middleware/auth');
const { feeScope, requireRegistrar } = require('../middleware/feeScope');
const {
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
} = require('../validators/feeValidators');

const programController = require('../controllers/programController');
const partnerController = require('../controllers/partnerController');
const studentController = require('../controllers/studentController');
const batchController = require('../controllers/batchController');
const commissionController = require('../controllers/commissionController');
const refundController = require('../controllers/refundController');
const summaryController = require('../controllers/summaryController');

const router = express.Router();

/**
 * Every /api/fees/* route requires a valid staff session — `protect`
 * rejects an unauthenticated request or a student-portal session outright
 * (portal sessions carry a different cookie/JWT and never populate
 * req.user), satisfying "unreachable to student portal sessions and
 * unauthenticated requests" (acceptance checklist).
 *
 * `authorize('admin')` is a deliberate, hard, module-wide gate on top of
 * that: for now, this entire module is admin-only, full stop — no
 * registrar/partner/counsellor account can reach any /api/fees/* route,
 * regardless of what the finer-grained rules below (feeScope,
 * requireRegistrar, per-route authorize lists) would otherwise allow. That
 * finer-grained logic is left intact, unused, rather than ripped out — if
 * this is ever opened up to those roles again, removing this one line
 * restores it exactly as originally built and tested.
 */
router.use(protect, authorize('admin'), feeScope);

// --- Programs --------------------------------------------------------------------------
router.get('/programs', programController.getPrograms);
router.get('/programs/:id', idParamRule, validate, programController.getProgramById);
router.post('/programs', requireRegistrar, programCreateRules, validate, programController.createProgram);
router.put('/programs/:id', requireRegistrar, programUpdateRules, validate, programController.updateProgram);

// --- Partners --------------------------------------------------------------------------
// Per the API table (section 5): registrar/admin see all + commission summary, partner sees only
// self. Counsellor's read-only access is scoped to their assigned students' ledgers, not the
// partner roster/commission data, so counsellor is deliberately excluded here (unlike /students).
router.get('/partners', authorize('admin', 'registrar', 'partner'), partnerController.getPartners);
router.get('/partners/:id', authorize('admin', 'registrar', 'partner'), idParamRule, validate, partnerController.getPartnerById);
router.post('/partners', requireRegistrar, partnerCreateRules, validate, partnerController.createPartner);
router.put('/partners/:id', requireRegistrar, partnerUpdateRules, validate, partnerController.updatePartner);

// --- Students --------------------------------------------------------------------------
// Specific paths before '/:id' so they aren't swallowed by the id route.
router.get('/students/plan-preview', planPreviewRules, validate, studentController.planPreview);
router.get('/students', studentQueryRules, validate, studentController.getStudents);
router.post('/students', requireRegistrar, studentCreateRules, validate, studentController.createStudent);
router.get('/students/:id', idParamRule, validate, studentController.getStudentById);
router.post('/students/:id/instalments/:idx/log-receipt', authorize('admin', 'registrar', 'partner'), logReceiptRules, validate, studentController.logReceipt);
router.post('/students/:id/instalments/:idx/confirm', requireRegistrar, instalmentParamRules, validate, studentController.confirmReceipt);
router.post('/students/:id/instalments/:idx/record-direct', requireRegistrar, recordDirectRules, validate, studentController.recordDirect);
router.post('/students/:id/instalments/:idx/submit-claim', requireRegistrar, instalmentParamRules, validate, studentController.submitClaim);

// --- Remittance batches ------------------------------------------------------------------
// Per the API table: registrar sees all, partner sees own. Counsellor is read-only on student
// ledgers only, not remittance batches — excluded here to match.
router.get('/batches', authorize('admin', 'registrar', 'partner'), batchController.getBatches);
router.post('/batches', authorize('admin', 'registrar', 'partner'), batchCreateRules, validate, batchController.createBatch);
router.post('/batches/:ref/confirm', requireRegistrar, batchRefParamRules, validate, batchController.confirmBatch);

// --- Commission --------------------------------------------------------------------------
router.get('/commission', requireRegistrar, commissionController.getCommission);

// --- Refunds -----------------------------------------------------------------------------
router.get('/refunds', requireRegistrar, refundController.getRefunds);
router.post('/refunds/preview', requireRegistrar, refundBodyRules, validate, refundController.previewRefund);
router.post('/refunds', requireRegistrar, refundBodyRules, validate, refundController.approveRefund);

// --- Summary / alerts / feed ---------------------------------------------------------------
router.get('/summary', summaryController.getSummary);
router.get('/alerts', summaryController.getAlerts);
router.get('/feed', summaryController.getFeed);

module.exports = router;
