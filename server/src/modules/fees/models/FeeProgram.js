const mongoose = require('mongoose');

/**
 * One college program with a fee structure and instalment template, sourced
 * from the college fact sheets (see seed/seedFees.js for the four seeded
 * programs). `feeLines` are the itemized invoice lines (Tuition, Books,
 * Admin, ...); `instalmentTemplate` is the self-funding instalment plan from
 * the fact sheet, used as-is by buildPlan() for `self` students and as the
 * basis (plus surcharge) for `intl` students.
 */
const TYPES = ['Certificate', 'Diploma'];

const FeeLineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const InstalmentTemplateRowSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const FeeProgramSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: TYPES, required: true },
    durationShort: { type: String, trim: true, default: '' },
    durationFull: { type: String, trim: true, default: '' },
    hoursTotal: { type: Number, required: true, min: 1 },

    feeLines: { type: [FeeLineSchema], default: [] },
    totalCents: { type: Number, required: true, min: 0 }, // must equal sum(feeLines) — validated below
    selfFundingCents: { type: Number, required: true, min: 0 },
    intlSurchargeCents: { type: Number, default: 0, min: 0 },

    instalmentTemplate: { type: [InstalmentTemplateRowSchema], default: [] },
    planLabel: { type: String, trim: true, default: '' },
    planNote: { type: String, trim: true, default: '' },

    // "All instalments must clear before N days of program start" — null
    // means no such rule (e.g. monthly-billed programs). See buildPlan().
    clearBeforeDays: { type: Number, default: null },

    admissionRequirements: { type: String, trim: true, default: '' },
    nocCode: { type: String, trim: true, default: '' },
    nocFull: { type: String, trim: true, default: '' },
    teer: { type: String, trim: true, default: '' },
    expressEntryEligible: { type: Boolean, default: false },
    placement: { type: String, trim: true, default: '' },
    jobAssistance: { type: Boolean, default: false },
    schedule: { type: String, trim: true, default: '' },
    bonus: { type: String, trim: true, default: '' },
    bjoNote: { type: String, trim: true, default: '' },

    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Keeps totalCents honest against feeLines whenever either changes, instead
// of trusting a hand-entered total to stay in sync.
FeeProgramSchema.pre('validate', function validateTotal(next) {
  if (this.feeLines && this.feeLines.length) {
    const sum = this.feeLines.reduce((acc, line) => acc + (line.amountCents || 0), 0);
    if (this.totalCents == null) this.totalCents = sum;
    if (this.totalCents !== sum) {
      return next(new Error(`totalCents (${this.totalCents}) does not match the sum of feeLines (${sum})`));
    }
  }
  next();
});

FeeProgramSchema.statics.TYPES = TYPES;

module.exports = mongoose.model('FeeProgram', FeeProgramSchema);
