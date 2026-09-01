const express = require('express');
const { getCommunications, createCommunication, getInbox, getUnreadCount } = require('../controllers/communicationController');
const { protect } = require('../middleware/auth');
const { communicationCreateRules, validate } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

// Specific paths first so they aren't swallowed by the '/' + query-param route below.
router.get('/inbox', getInbox);
router.get('/unread-count', getUnreadCount);
router.get('/', getCommunications);
router.post('/', communicationCreateRules, validate, createCommunication);

module.exports = router;
