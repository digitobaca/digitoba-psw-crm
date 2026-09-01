const rateLimit = require('express-rate-limit');

/**
 * express-rate-limit keys by IP by default, which in local dev means every
 * account (yours, a counsellor's, a student's) on the same machine shares
 * one bucket — a handful of test logins can lock out a real login. Keep the
 * limits strict in production; give dev/test a lot more headroom so this
 * doesn't bite during normal local testing.
 */
const isProd = process.env.NODE_ENV === 'production';

/** Generous baseline limiter applied to the whole API. */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 300 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/** Tighter limiter for public lead submissions to deter spam/bots. */
const leadSubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many submissions from this device. Please try again later.' },
});

/** Tighter limiter for login attempts to deter brute-forcing. */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please try again later.' },
});

module.exports = { generalLimiter, leadSubmitLimiter, loginLimiter };
