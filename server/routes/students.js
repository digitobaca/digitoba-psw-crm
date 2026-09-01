const express = require('express');
const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  addStudentNote,
  deleteStudent,
} = require('../controllers/studentController');
const { activateStudentPortal } = require('../controllers/authController');
const { protect, authorize, scopeToCounsellor } = require('../middleware/auth');
const { leadSubmitLimiter } = require('../middleware/rateLimiter');
const {
  studentCreateRules,
  studentUpdateRules,
  studentQueryRules,
  noteRules,
  idParamRule,
  validate,
} = require('../middleware/validators');

const router = express.Router();

// Public: lead capture from any marketing-site form
router.post('/', leadSubmitLimiter, studentCreateRules, validate, createStudent);

// Private: CRM — counsellors are scoped to their own assigned students via scopeToCounsellor
router.get('/', protect, scopeToCounsellor, studentQueryRules, validate, getStudents);
router.get('/:id', protect, scopeToCounsellor, idParamRule, validate, getStudentById);
router.put('/:id', protect, scopeToCounsellor, studentUpdateRules, validate, updateStudent);
router.post('/:id/notes', protect, scopeToCounsellor, noteRules, validate, addStudentNote);
router.post('/:id/activate-portal', protect, scopeToCounsellor, idParamRule, validate, activateStudentPortal);
router.delete('/:id', protect, authorize('admin'), idParamRule, validate, deleteStudent);

module.exports = router;
