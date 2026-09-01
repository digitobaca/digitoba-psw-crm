const jwt = require('jsonwebtoken');

/**
 * Signs a JWT for the given id and sets it as an HTTP-only cookie on the
 * response. Keeping the token out of localStorage/JS reach mitigates XSS
 * token theft. `cookieNameOverride` lets the student portal use a distinct
 * cookie (cd_portal_token) so a portal session and a staff session never
 * collide in the same browser.
 */
const generateToken = (res, id, cookieNameOverride) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  const cookieName = cookieNameOverride || process.env.JWT_COOKIE_NAME || 'cd_token';

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/',
  });

  return token;
};

module.exports = generateToken;
