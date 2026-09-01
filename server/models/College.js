const mongoose = require('mongoose');

/**
 * The verified institution database. Deliberately small and hand-curated
 * rather than an exhaustive scrape of every Canadian institution — each
 * record should be added and reviewed by staff, never AI-generated, since
 * wrong admission/tuition data here directly costs students money and time.
 */
const CollegeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      maxlength: 200,
    },
    campuses: [{ type: String, trim: true }], // e.g. ["Toronto", "Scarborough"]
    province: {
      type: String,
      required: [true, 'Province is required'],
      trim: true,
    },
    website: { type: String, trim: true, default: '' },
    isDesignatedLearningInstitution: { type: Boolean, default: true }, // DLI status (PGWP eligibility)
    partnerStatus: {
      type: String,
      enum: ['Direct Partner', 'Indirect Partner', 'Non-Partner'],
      default: 'Non-Partner',
    },
    // Every fact here should be traceable to an actual review, not invented.
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: Date,
    officialNotes: { type: String, trim: true, default: '', maxlength: 3000 }, // confirmed facts only
    internalNotes: { type: String, trim: true, default: '', maxlength: 3000 }, // counsellor opinions/experience
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CollegeSchema.index({ name: 'text' });
CollegeSchema.index({ province: 1 });

module.exports = mongoose.model('College', CollegeSchema);
