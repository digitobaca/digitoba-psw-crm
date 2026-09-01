const mongoose = require('mongoose');

/**
 * Tracks one student's application to one program from submission through
 * offer/refusal and LOA. A student can have multiple Applications (one per
 * shortlisted college/program), which is why this is its own collection
 * rather than embedded on Student.
 *
 * Fully admin-managed end to end — the same admin who liaises with colleges
 * on a case takes it from "College Selected" through to admission details,
 * no separate external portal involved.
 */
const APPLICATION_STAGES = [
  'College Selected',
  'Documents Ready',
  'Submitted',
  'Application Number Received',
  'Offer',
  'Refusal',
  'Deposit Paid',
  'LOA Received',
  'Visa Filed',
  'Visa Approved',
  'Enrolled',
];

const ApplicationSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College', required: true },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },

    stage: {
      type: String,
      enum: APPLICATION_STAGES,
      default: 'College Selected',
    },
    applicationNumber: { type: String, trim: true, default: '' },
    intake: { type: String, trim: true, default: '' },

    // Admission details, filled in by admin once the college confirms.
    admissionStartDate: Date,
    admissionDetails: { type: String, trim: true, default: '', maxlength: 2000 },

    // Simple append-only history so "what happened and when" is always visible.
    history: [
      {
        stage: { type: String, enum: APPLICATION_STAGES },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, trim: true, default: '' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    submittedAt: Date,
    decisionAt: Date,
    notes: { type: String, trim: true, default: '', maxlength: 2000 },
  },
  { timestamps: true }
);

ApplicationSchema.index({ student: 1 });
ApplicationSchema.index({ stage: 1 });

ApplicationSchema.statics.STAGES = APPLICATION_STAGES;

module.exports = mongoose.model('Application', ApplicationSchema);
