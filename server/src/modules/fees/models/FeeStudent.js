const mongoose = require('mongoose');

/**
 * A student's fee ledger: the concrete instalment plan generated from a
 * program + funding type + cohort start date (see services/buildPlan.js),
 * plus the running state of every instalment. This is a separate collection
 * from the existing CRM `Student` model (leads/pipeline) — `leadId` is an
 * optional soft link to that model so a fee ledger can be traced back to the
 * lead it came from, but the two are never merged or written to from each
 * other's code paths.
 */
const FUNDING_TYPES = ['intl', 'self', 'bjo'];
const CHANNELS = ['agent', 'direct', 'funder'];
const STORED_STATUSES = ['due', 'agent', 'funder', 'cleared'];

const FeeInstalmentSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    amountCents: { type: Number, required: true, min: 0 }, // invoiced amount
    reportedCents: { type: Number, default: null }, // what the partner says they collected (may differ)
    dueDate: { type: Date, required: true },
    channel: { type: String, enum: CHANNELS, required: true },
    status: { type: String, enum: STORED_STATUSES, default: 'due' }, // stored status only — see services/effectiveStatus.js
    collectedOn: { type: Date, default: null },
    batchRef: { type: String, default: null }, // set when included in a remittance batch
    receiptRef: { type: String, default: null },
    cancelled: { type: Boolean, default: false },
  },
  { _id: false }
);

const WithdrawalSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    reason: { type: String, required: true },
    refundCents: { type: Number, required: true },
    clawbackCents: { type: Number, required: true },
  },
  { _id: false }
);

const FeeStudentSchema = new mongoose.Schema(
  {
    sid: { type: String, required: true, unique: true, trim: true }, // "PIC-YY-NNNN"
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },

    // Soft link to the existing CRM lead-pipeline record (models/Student.js)
    // and/or the Application tracker — optional, never required.
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },

    programId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeProgram', required: true },
    fundingType: { type: String, enum: FUNDING_TYPES, required: true },
    // Required iff fundingType === 'intl' — enforced in the validator layer
    // and re-checked in services/transitions.createStudent.
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePartner', default: null },
    cohortStart: { type: Date, required: true },

    instalments: { type: [FeeInstalmentSchema], default: [] },

    withdrawal: { type: WithdrawalSchema, default: null },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeeStudentSchema.index({ partnerId: 1 });
FeeStudentSchema.index({ programId: 1 });
FeeStudentSchema.index({ fundingType: 1 });
FeeStudentSchema.index({ leadId: 1 });
FeeStudentSchema.index({ name: 'text', sid: 'text', email: 'text' });

FeeStudentSchema.statics.FUNDING_TYPES = FUNDING_TYPES;
FeeStudentSchema.statics.CHANNELS = CHANNELS;
FeeStudentSchema.statics.STORED_STATUSES = STORED_STATUSES;

module.exports = mongoose.model('FeeStudent', FeeStudentSchema);
