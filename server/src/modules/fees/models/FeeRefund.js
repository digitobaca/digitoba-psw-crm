const mongoose = require('mongoose');

/** An approved refund calculated under Ontario Regulation 415/06 — see services/refundCalc.js. */
const REASONS = ['rescind', 'before', 'visa', 'after'];
const STATUSES = ['approved', 'paid'];

const FeeRefundSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStudent', required: true },
    programName: { type: String, trim: true, default: '' },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePartner', default: null },

    noticeDate: { type: Date, required: true },
    reason: { type: String, enum: REASONS, required: true },
    hoursDelivered: { type: Number, default: 0, min: 0 },
    booksReturned: { type: Boolean, default: false },

    paidCents: { type: Number, required: true, min: 0 },
    serviceFeeCents: { type: Number, required: true, min: 0 },
    earnedCents: { type: Number, required: true, min: 0 },
    booksCents: { type: Number, required: true, min: 0 },
    refundCents: { type: Number, required: true, min: 0 },
    clawbackCents: { type: Number, required: true, min: 0 },

    dueBy: { type: Date, required: true }, // noticeDate + 30 days
    status: { type: String, enum: STATUSES, default: 'approved' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeeRefundSchema.index({ studentId: 1 });
FeeRefundSchema.index({ partnerId: 1 });

FeeRefundSchema.statics.REASONS = REASONS;
FeeRefundSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('FeeRefund', FeeRefundSchema);
