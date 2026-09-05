const mongoose = require('mongoose');

/** Audit + activity feed entry — every mutation in the module writes one of these (see services/transitions.js). */
const TAGS = ['NEW', 'AGENT WRITE', 'MISMATCH', 'CONFIRMED', 'DIRECT', 'BJO', 'REMIT', 'RECONCILED', 'REFUND', 'CANCELLED'];
const TONES = ['ok', 'warn', 'info', 'bad'];

const FeeLedgerEventSchema = new mongoose.Schema(
  {
    tag: { type: String, enum: TAGS, required: true },
    tone: { type: String, enum: TONES, required: true },
    text: { type: String, required: true, trim: true },

    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeStudent', default: null },
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeePartner', default: null },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'FeeRemittanceBatch', default: null },

    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    actorRole: { type: String, default: '' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

FeeLedgerEventSchema.index({ createdAt: -1 });
FeeLedgerEventSchema.index({ studentId: 1 });
FeeLedgerEventSchema.index({ partnerId: 1 });

FeeLedgerEventSchema.statics.TAGS = TAGS;
FeeLedgerEventSchema.statics.TONES = TONES;

module.exports = mongoose.model('FeeLedgerEvent', FeeLedgerEventSchema);
