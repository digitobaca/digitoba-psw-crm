const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const User = require('../models/User');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const generateToken = require('../utils/generateToken');
const { sendEmail } = require('../utils/sendEmail');

// ==================================================================================
// Staff (admin/counsellor) auth — login/logout double as shift start/end for
// the attendance system: a shift begins automatically on login, and ends
// (with a required "what did you get done today" summary) on logout.
// ==================================================================================

/** @desc Log a team member in, set an HTTP-only JWT cookie, and start their shift. @route POST /api/auth/login @access Public */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !user.isActive || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  generateToken(res, user._id);

  // Resume an already-open shift (e.g. the browser was closed without
  // logging out) rather than starting a second overlapping one.
  let shift = await Attendance.findOne({ user: user._id, status: 'Active' });
  if (!shift) {
    shift = await Attendance.create({ user: user._id, shiftStart: new Date() });
  }

  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    shift: { id: shift._id, shiftStart: shift.shiftStart },
  });
});

/**
 * @desc    End the current shift (records shiftEnd + the "what did you get
 *          done today" summary) and log the user out by clearing the cookie.
 *          `summary` is encouraged client-side but never blocks logout here —
 *          a session that's expiring or a browser that's closing shouldn't
 *          get stuck unable to sign out.
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const { summary } = req.body;

  const shift = await Attendance.findOne({ user: req.user._id, status: 'Active' });
  if (shift) {
    const shiftEnd = new Date();
    shift.shiftEnd = shiftEnd;
    shift.durationMinutes = Math.round((shiftEnd - shift.shiftStart) / 60000);
    shift.summary = (summary || '').trim();
    shift.status = 'Completed';
    await shift.save();
  }

  const cookieName = process.env.JWT_COOKIE_NAME || 'cd_token';
  res.clearCookie(cookieName, { path: '/' });
  res.json({ success: true, message: 'Shift ended. Logged out.' });
});

/** @desc Return the currently authenticated staff user + their open shift, if any. @route GET /api/auth/me @access Private */
const getMe = asyncHandler(async (req, res) => {
  const shift = await Attendance.findOne({ user: req.user._id, status: 'Active' });
  res.json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role },
    shift: shift ? { id: shift._id, shiftStart: shift.shiftStart } : null,
  });
});

// ==================================================================================
// Counsellor management (admin only)
// ==================================================================================

/** @desc List all counsellor accounts with their current caseload. @route GET /api/auth/counsellors @access Private (admin) */
const getCounsellors = asyncHandler(async (req, res) => {
  const counsellors = await User.find({ role: 'counsellor' }).sort({ name: 1 });
  res.json({ success: true, data: counsellors });
});

/** @desc Create a new counsellor account. @route POST /api/auth/counsellors @access Private (admin) */
const createCounsellor = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const counsellor = await User.create({ name, email, phone, password, role: 'counsellor' });
  res.status(201).json({
    success: true,
    data: { id: counsellor._id, name: counsellor.name, email: counsellor.email, role: counsellor.role },
  });
});

/** @desc Activate/deactivate a counsellor or update their details. @route PUT /api/auth/counsellors/:id @access Private (admin) */
const updateCounsellor = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'isActive'];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const counsellor = await User.findOneAndUpdate({ _id: req.params.id, role: 'counsellor' }, updates, {
    new: true,
    runValidators: true,
  });
  if (!counsellor) {
    res.status(404);
    throw new Error('Counsellor not found');
  }
  res.json({ success: true, data: counsellor });
});

// ==================================================================================
// Student portal auth — separate track, separate cookie, separate collection.
// ==================================================================================

const PORTAL_COOKIE = process.env.PORTAL_JWT_COOKIE_NAME || 'cd_portal_token';

/**
 * @desc    Staff-triggered: generates a temporary portal password for a
 *          student, activates their portal access, and emails it to them.
 * @route   POST /api/students/:id/activate-portal
 * @access  Private
 */
const activateStudentPortal = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, ...req.scopeFilter });
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  const tempPassword = crypto.randomBytes(6).toString('hex'); // 12-char random password
  student.portalPassword = tempPassword;
  student.portalActive = true;
  await student.save();

  await sendEmail({
    to: student.email,
    subject: 'Your CanadaDigitoba Student Portal is ready',
    text: `Hi ${student.name.split(' ')[0]},\n\nYour student portal is ready. Log in at ${process.env.CLIENT_URL}/portal/login with:\n\nEmail: ${student.email}\nTemporary password: ${tempPassword}\n\nPlease change your password after logging in.\n\n— CanadaDigitoba`,
    html: `<p>Hi ${student.name.split(' ')[0]},</p><p>Your student portal is ready. Log in at <a href="${process.env.CLIENT_URL}/portal/login">${process.env.CLIENT_URL}/portal/login</a> with:</p><p><strong>Email:</strong> ${student.email}<br/><strong>Temporary password:</strong> ${tempPassword}</p><p>Please change your password after logging in.</p>`,
  }).catch((err) => console.error('Portal activation email failed:', err.message));

  res.json({ success: true, message: 'Portal activated and credentials emailed to the student.' });
});

/** @desc Student portal login. @route POST /api/portal/login @access Public */
const portalLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const student = await Student.findOne({ email: email.toLowerCase() }).select('+portalPassword');

  if (!student || !student.portalActive || !student.portalPassword || !(await student.comparePortalPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  generateToken(res, student._id, PORTAL_COOKIE);

  res.json({
    success: true,
    student: { id: student._id, name: student.name, email: student.email, pipelineStage: student.pipelineStage },
  });
});

/** @desc Log the student portal session out. @route POST /api/portal/logout @access Private (student) */
const portalLogout = asyncHandler(async (req, res) => {
  res.clearCookie(PORTAL_COOKIE, { path: '/' });
  res.json({ success: true, message: 'Logged out' });
});

/** @desc Return the currently authenticated student. @route GET /api/portal/me @access Private (student) */
const portalMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    student: {
      id: req.student._id,
      name: req.student.name,
      email: req.student.email,
      pipelineStage: req.student.pipelineStage,
    },
  });
});

/** @desc Student changes their own portal password. @route PUT /api/portal/password @access Private (student) */
const portalChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const student = await Student.findById(req.student._id).select('+portalPassword');
  if (!(await student.comparePortalPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  if (!newPassword || newPassword.length < 8) {
    res.status(400);
    throw new Error('New password must be at least 8 characters');
  }

  student.portalPassword = newPassword;
  await student.save();
  res.json({ success: true, message: 'Password updated' });
});

module.exports = {
  login,
  logout,
  getMe,
  getCounsellors,
  createCounsellor,
  updateCounsellor,
  activateStudentPortal,
  portalLogin,
  portalLogout,
  portalMe,
  portalChangePassword,
};
