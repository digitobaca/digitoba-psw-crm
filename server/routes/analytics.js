const express = require('express');
const { getOverview } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/overview', protect, authorize('admin'), getOverview);

module.exports = router;
