const mongoose = require('mongoose');

/** A recruitment agent/agency that recruits `intl` students and earns commission on cleared instalments. */
const TIERS = ['Tier 1', 'Tier 2', 'Tier 3'];

const FeePartnerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    contactName: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },

    tier: { type: String, enum: TIERS, required: true },
    commissionRatePct: { type: Number, required: true, min: 0, max: 100 },
    // Days a partner is expected to remit held cash to the college within —
    // used to flag "late" in the commission view (see services/commission.js).
    remitWindowDays: { type: Number, default: 7, min: 1 },

    active: { type: Boolean, default: true },

    // The partner-portal login for this agency, if one has been created.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeePartnerSchema.index({ name: 1 });

FeePartnerSchema.statics.TIERS = TIERS;

module.exports = mongoose.model('FeePartner', FeePartnerSchema);
