const express = require('express');
const {
  getApplications,
  getApplicationById,
  createApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const { applicationCreateRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

// Reading applications is shared (counsellors scoped to their own students,
// enforced in the controller); creating one and editing its stage/admission
// details is the admin's "move it forward" step in the CRM's workflow — a
// counsellor's job stops at submitting the student for review.
router.get('/', getApplications);
router.get('/:id', idParamRule, validate, getApplicationById);
router.post('/', authorize('admin'), applicationCreateRules, validate, createApplication);
router.put('/:id', authorize('admin'), idParamRule, validate, updateApplication);
router.delete('/:id', authorize('admin'), idParamRule, validate, deleteApplication);

module.exports = router;
