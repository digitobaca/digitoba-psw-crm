const express = require('express');
const { createDeletionRequest } = require('../controllers/deletionRequestController');
const { leadSubmitLimiter } = require('../middleware/rateLimiter');
const { deletionRequestRules, validate } = require('../middleware/validators');

const router = express.Router();

// Same rate limit as lead capture — public, unauthenticated, deserves the
// same spam/abuse guard.
router.post('/', leadSubmitLimiter, deletionRequestRules, validate, createDeletionRequest);

module.exports = router;
