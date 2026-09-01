const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Student = require('../models/Student');

/**
 * Protects a staff (admin/counsellor) route: requires a valid JWT from the
 * HTTP-only cookie, or an Authorization: Bearer header as a fallback for
 * API clients/tools.
 */
const protect = asyncHandler(async (req, res, next) => {
  const cookieName = process.env.JWT_COOKIE_NAME || 'cd_token';
  let token = req.cookies?.[cookieName];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. Please log in.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('Not authorized. User no longer exists or is inactive.');
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized. Invalid or expired session.');
  }
});

/**
 * Populates req.user if a valid staff session exists, but never blocks the
 * request otherwise. Used by routes that serve different data to the public
 * vs. logged-in staff (e.g. the college database: visitors see only
 * verified entries, staff see everything).
 */
const optionalAuth = async (req, res, next) => {
  const cookieName = process.env.JWT_COOKIE_NAME || 'cd_token';
  const token = req.cookies?.[cookieName];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) req.user = user;
  } catch {
    // Invalid/expired token — just proceed as an anonymous visitor.
  }
  next();
};

/** Restricts a route to specific roles, e.g. authorize('admin'). */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('You do not have permission to perform this action.');
  }
  next();
};

/**
 * Builds the Mongoose filter that scopes a counsellor to only their assigned
 * students; admins see everything. Controllers spread `req.scopeFilter` into
 * their query. Must run after `protect`.
 */
const scopeToCounsellor = (req, res, next) => {
  req.scopeFilter = req.user.role === 'counsellor' ? { assignedCounsellor: req.user._id } : {};
  next();
};

/**
 * Separate auth track for the student self-service portal — students log in
 * with their own password against the Student collection, using a distinct
 * cookie so a portal session and a staff session never collide in the same
 * browser (e.g. a counsellor demoing the portal in another tab).
 */
const protectStudent = asyncHandler(async (req, res, next) => {
  const cookieName = process.env.PORTAL_JWT_COOKIE_NAME || 'cd_portal_token';
  let token = req.cookies?.[cookieName];

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. Please log in to the student portal.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);

    if (!student || !student.portalActive) {
      res.status(401);
      throw new Error('Not authorized. Portal account no longer active.');
    }

    req.student = student;
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized. Invalid or expired session.');
  }
});

module.exports = { protect, optionalAuth, authorize, scopeToCounsellor, protectStudent };
