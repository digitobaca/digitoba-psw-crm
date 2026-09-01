const express = require('express');
const { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram } = require('../controllers/programController');
const { protect, optionalAuth, authorize } = require('../middleware/auth');
const { programCreateRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.get('/', optionalAuth, getPrograms);
router.get('/:id', optionalAuth, idParamRule, validate, getProgramById);
router.post('/', protect, authorize('admin'), programCreateRules, validate, createProgram);
router.put('/:id', protect, authorize('admin'), idParamRule, validate, updateProgram);
router.delete('/:id', protect, authorize('admin'), idParamRule, validate, deleteProgram);

module.exports = router;
