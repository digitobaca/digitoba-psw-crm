const express = require('express');
const {
  login,
  logout,
  getMe,
  getCounsellors,
  createCounsellor,
  updateCounsellor,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { loginRules, logoutRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

router.post('/login', loginLimiter, loginRules, validate, login);
router.post('/logout', protect, logoutRules, validate, logout);
router.get('/me', protect, getMe);

// Counsellor management (admin only)
router.get('/counsellors', protect, authorize('admin'), getCounsellors);
router.post('/counsellors', protect, authorize('admin'), createCounsellor);
router.put('/counsellors/:id', protect, authorize('admin'), idParamRule, validate, updateCounsellor);

module.exports = router;
