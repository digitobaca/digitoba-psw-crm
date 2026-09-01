const express = require('express');
const {
  getCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getOverview,
} = require('../controllers/adCampaignController');
const { protect, authorize } = require('../middleware/auth');
const { adCampaignRules, idParamRule, validate } = require('../middleware/validators');

const router = express.Router();

// Ads Dashboard is admin-only — marketing spend/decisions aren't a
// counsellor's job, same reasoning as Partners/Colleges elsewhere.
router.use(protect, authorize('admin'));

// Specific path first so it isn't swallowed by the '/:id' route below.
router.get('/overview', getOverview);
router.get('/', getCampaigns);
router.get('/:id', idParamRule, validate, getCampaignById);
router.post('/', adCampaignRules, validate, createCampaign);
router.put('/:id', idParamRule, adCampaignRules, validate, updateCampaign);
router.delete('/:id', idParamRule, validate, deleteCampaign);

module.exports = router;
