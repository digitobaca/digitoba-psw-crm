const asyncHandler = require('express-async-handler');
const Payment = require('../models/Payment');

/** @desc List payments, optionally filtered by student. @route GET /api/payments?student=:id @access Private */
const getPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.status) filter.status = req.query.status;

  const payments = await Payment.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: payments });
});

/**
 * @desc    Record a payment/invoice. No live gateway is wired in yet — this
 *          is a manual/staff-recorded entry until Razorpay/Stripe is added.
 * @route   POST /api/payments
 * @access  Private
 */
const createPayment = asyncHandler(async (req, res) => {
  const { student, application, type, amount, currency, dueDate, notes } = req.body;

  const payment = await Payment.create({
    student,
    application: application || null,
    type,
    amount,
    currency,
    dueDate,
    notes,
    recordedBy: req.user._id,
  });

  res.status(201).json({ success: true, data: payment });
});

/** @desc Update a payment's status (e.g. mark Paid/Refunded). @route PUT /api/payments/:id @access Private */
const updatePayment = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.status === 'Paid' && !updates.paidAt) updates.paidAt = new Date();

  const payment = await Payment.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  res.json({ success: true, data: payment });
});

/** @desc Delete a payment record. @route DELETE /api/payments/:id @access Private (admin) */
const deletePayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Payment not found');
  }
  res.json({ success: true, message: 'Payment deleted' });
});

module.exports = { getPayments, createPayment, updatePayment, deletePayment };
