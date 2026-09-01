const express = require('express');
const { portalLogin, portalLogout, portalMe, portalChangePassword } = require('../controllers/authController');
const {
  getMyProfile,
  updateMyProfile,
  getMyDocuments,
  uploadMyDocument,
  getMyApplications,
  getMyPayments,
  getMyMessages,
  sendMyMessage,
} = require('../controllers/portalController');
const { protectStudent } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { loginLimiter } = require('../middleware/rateLimiter');
const { portalLoginRules, validate } = require('../middleware/validators');

const router = express.Router();

// Auth
router.post('/login', loginLimiter, portalLoginRules, validate, portalLogin);
router.post('/logout', protectStudent, portalLogout);
router.get('/me', protectStudent, portalMe);
router.put('/password', protectStudent, portalChangePassword);

// Profile
router.get('/profile', protectStudent, getMyProfile);
router.put('/profile', protectStudent, updateMyProfile);

// Documents
router.get('/documents', protectStudent, getMyDocuments);
router.post('/documents', protectStudent, upload.single('file'), uploadMyDocument);

// Applications, payments, messages (read-only / message-send)
router.get('/applications', protectStudent, getMyApplications);
router.get('/payments', protectStudent, getMyPayments);
router.get('/messages', protectStudent, getMyMessages);
router.post('/messages', protectStudent, sendMyMessage);

module.exports = router;
