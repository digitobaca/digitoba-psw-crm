const mongoose = require('mongoose');

/**
 * Records and displays payment/invoice status. Phase 1 has no live payment
 * gateway wired in (per project decision) — entries are created manually by
 * staff or via a future gateway webhook. `status` and `gatewayRef` are
 * designed so a real Razorpay/Stripe integration can slot in later without a
 * schema change: just start populating `gatewayRef`/`gatewayProvider` and
 * flipping `status` from a webhook handler instead of the admin UI.
 */
const PaymentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },

    type: {
      type: String,
      enum: ['Application Fee', 'Tuition Deposit', 'Service Fee', 'Other'],
      required: true,
    },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'CAD' },

    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded', 'Failed'],
      default: 'Pending',
    },

    gatewayProvider: { type: String, trim: true, default: '' }, // 'razorpay' | 'stripe' | '' (manual)
    gatewayRef: { type: String, trim: true, default: '' },
    invoiceUrl: { type: String, trim: true, default: '' },

    dueDate: Date,
    paidAt: Date,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes: { type: String, trim: true, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

PaymentSchema.index({ student: 1 });
PaymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);
