const mongoose = require('mongoose');

/**
 * One row per ad campaign / boosted post / SEO effort you want to track
 * performance for — modeled on the "Spend → Leads → Qualified Leads →
 * Applications → Deposits → Enrolments → Revenue" decision framework (see
 * the Marketing Decision Tracker this was built from).
 *
 * Deliberately split in two: the ad-platform numbers (spend, impressions,
 * clicks) are things only YOU know and enter by hand — there's no live
 * Meta/Google Ads API wired in (same "stub until a provider is configured"
 * pattern as WhatsApp/payments elsewhere in this app). Everything past that
 * (leads, qualified leads, applications, deposits, enrolments, revenue) is
 * NOT stored here at all — it's computed live from real `Student` and
 * `Payment` records attributed to this campaign (see
 * adCampaignController.js), so it's never stale and never double-entered.
 */
const CHANNELS = ['Meta Ads', 'Instagram Boost', 'Google Ads', 'TikTok', 'YouTube', 'SEO / Organic', 'Other'];
const OBJECTIVES = ['Lead Generation', 'Awareness', 'Traffic', 'Applications', 'Conversions', 'Engagement', 'Other'];
const STATUSES = ['Active', 'Paused', 'Completed', 'Stopped'];
const DECISIONS = ['Scale', 'Keep', 'Modify', 'Pause', 'Stop'];

const AdCampaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    channel: { type: String, enum: CHANNELS, required: true },
    platform: { type: String, trim: true, default: '' }, // e.g. "Instagram", "Facebook", "Google Search" — more specific than channel
    program: { type: String, trim: true, default: '' }, // e.g. "PSW Pathway to Canada" — free text so it matches whatever's in Student.intendedProgram
    objective: { type: String, enum: OBJECTIVES, default: 'Lead Generation' },
    status: { type: String, enum: STATUSES, default: 'Active' },

    startDate: Date,
    endDate: Date,

    // Ad-platform numbers — manually entered/updated, e.g. weekly.
    spend: { type: Number, default: 0, min: 0 },
    impressions: { type: Number, default: 0, min: 0 },
    clicks: { type: Number, default: 0, min: 0 },

    adLink: { type: String, trim: true, default: '' }, // link to the actual ad/post/campaign in the ad platform

    // How leads get auto-attributed to this campaign: any public form
    // submission carrying ?utm_campaign=<this slug> in the URL gets linked
    // here automatically (see studentController.createStudent). Leads can
    // always be attributed/corrected by hand too (Student.campaign).
    utmSlug: { type: String, trim: true, lowercase: true, default: '', unique: true, sparse: true },

    // The team's own call, always overridable — separate from whatever the
    // dashboard's lightweight suggested-decision logic proposes.
    decision: { type: String, enum: [...DECISIONS, ''], default: '' },
    notes: { type: String, trim: true, default: '', maxlength: 2000 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

AdCampaignSchema.index({ channel: 1 });
AdCampaignSchema.index({ status: 1 });

AdCampaignSchema.statics.CHANNELS = CHANNELS;
AdCampaignSchema.statics.OBJECTIVES = OBJECTIVES;
AdCampaignSchema.statics.STATUSES = STATUSES;
AdCampaignSchema.statics.DECISIONS = DECISIONS;

module.exports = mongoose.model('AdCampaign', AdCampaignSchema);
