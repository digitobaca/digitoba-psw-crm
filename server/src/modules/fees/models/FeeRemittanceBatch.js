const mongoose = require('mongoose');

/** One wire from a partner covering many instalments across many students. */
const STATUSES = ['pending', 'reconciled'];

const BatchItemSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStudent', required: true },
    instalmentIndex: { type: Number, required: true, min: 0 },
    amountCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const FeeRemittanceBatchSchema = new mongoose.Schema(
  {
    ref: { type: String, required: true, unique: true, trim: true }, // e.g. "MC-2026-07"
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePartner', required: true },
    items: { type: [BatchItemSchema], default: [] },
    amountCents: { type: Number, required: true, min: 0 }, // sum of items
    wireRef: { type: String, trim: true, default: '' },
    sentOn: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: 'pending' },
    confirmedOn: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

FeeRemittanceBatchSchema.index({ partnerId: 1 });
FeeRemittanceBatchSchema.index({ status: 1 });

FeeRemittanceBatchSchema.statics.STATUSES = STATUSES;

module.exports = mongoose.model('FeeRemittanceBatch', FeeRemittanceBatchSchema);
