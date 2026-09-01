const express = require('express');
const { getColleges, getCollegeById, createCollege, updateCollege, deleteCollege } = require('../controllers/collegeController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { collegeCreateRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.get('/', optionalAuth, getColleges);
router.get('/:id', optionalAuth, idParamRule, validate, getCollegeById);
router.post('/', protect, authorize('admin'), collegeCreateRules, validate, createCollege);
router.put('/:id', protect, authorize('admin'), idParamRule, validate, updateCollege);
router.delete('/:id', protect, authorize('admin'), idParamRule, validate, deleteCollege);

module.exports = router;
