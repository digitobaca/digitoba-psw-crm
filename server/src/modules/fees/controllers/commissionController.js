const asyncHandler = require('express-async-handler');
const FeePartner = require('../models/FeePartner');
const FeeStudent = require('../models/FeeStudent');
const FeeRefund = require('../models/FeeRefund');
const commission = require('../services/commission');

/** @desc Per-partner commission rows + total net payable. @route GET /api/fees/commission @access registrar/admin */
const getCommission = asyncHandler(async (req, res) => {
  const now = req.feeCtx.now;
  const partners = await FeePartner.find().sort({ name: 1 });
  const refunds = await FeeRefund.find();

  const rows = await Promise.all(
    partners.map(async (partner) => {
      const students = await FeeStudent.find({ partnerId: partner._id });
      return { partner, ...commission(partner, students, refunds, now) };
    })
  );

  const totalNetPayableCents = rows.reduce((sum, r) => sum + r.netPayableCents, 0);

  res.json({ success: true, data: { rows, totalNetPayableCents } });
});

module.exports = { getCommission };
