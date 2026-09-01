const mongoose = require('mongoose');

/**
 * A specific program offered by a College. Kept separate from College so one
 * institution can list many programs, each with its own tuition/intake/
 * requirements — and so the eligibility checker & cost calculator can query
 * programs directly instead of parsing free text.
 */
const ProgramSchema = new mongoose.Schema(
  {
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'A program must belong to a college'],
    },
    name: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
      maxlength: 200,
    },
    level: {
      type: String,
      enum: ['Certificate', 'Diploma', 'Bachelor', 'Master', 'PhD', 'PSW Certificate'],
      required: [true, 'Program level is required'],
    },
    field: { type: String, trim: true, default: '' }, // e.g. "Healthcare", "Business", "IT"
    durationMonths: Number,
    tuitionAmount: Number,
    tuitionCurrency: { type: String, default: 'CAD' },
    intakes: [{ type: String, trim: true }], // e.g. ["Jan 2027", "Sep 2027"]
    applicationDeadline: Date,

    // --- Requirements — the only fields the eligibility checker reads from ---
    admissionRequirements: { type: String, trim: true, default: '', maxlength: 2000 },
    englishRequirement: {
      ielts: Number,
      pte: Number,
      celpip: Number,
      toefl: Number,
      notes: { type: String, trim: true, default: '' },
    },
    minAcademicPercentage: Number, // simple numeric gate used by the eligibility checker

    applicationProcess: { type: String, trim: true, default: '', maxlength: 2000 },

    partnerStatus: {
      type: String,
      enum: ['Direct Partner', 'Indirect Partner', 'Non-Partner'],
      default: 'Non-Partner',
    },
    commissionPercent: Number, // internal — never surfaced to students/public site

    // Same official-vs-internal split as College, for the same reason.
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: Date,
    officialNotes: { type: String, trim: true, default: '', maxlength: 3000 },
    internalNotes: { type: String, trim: true, default: '', maxlength: 3000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProgramSchema.index({ college: 1 });
ProgramSchema.index({ level: 1 });
ProgramSchema.index({ name: 'text', field: 'text' });

module.exports = mongoose.model('Program', ProgramSchema);
