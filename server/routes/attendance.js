const express = require('express');
const { getAttendance, exportAttendance } = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');
const { attendanceQueryRules, validate } = require('../middleware/validators');

const router = express.Router();

// Specific path first so it isn't swallowed by the '/' route below.
router.get('/export', protect, authorize('admin'), attendanceQueryRules, validate, exportAttendance);

// Both roles hit the same endpoint — the controller scopes counsellors to
// their own records; only admins can pass ?user= to look at someone else's.
router.get('/', protect, attendanceQueryRules, validate, getAttendance);

module.exports = router;
