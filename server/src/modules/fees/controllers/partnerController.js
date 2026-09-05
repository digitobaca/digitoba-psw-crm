const asyncHandler = require('express-async-handler');
const FeePartner = require('../models/FeePartner');
const FeeStudent = require('../models/FeeStudent');
const FeeRefund = require('../models/FeeRefund');
const commission = require('../services/commission');
const { serializeStudent } = require('./helpers');

const PARTNER_FIELDS = ['name', 'city', 'country', 'contactName', 'phone', 'email', 'tier', 'commissionRatePct', 'remitWindowDays', 'active', 'userId'];

function pickFields(body) {
  const payload = {};
  for (const field of PARTNER_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
}

/** @desc List partners (registrar/admin: all + commission summary; partner: only self). @route GET /api/fees/partners */
const getPartners = asyncHandler(async (req, res) => {
  const now = req.feeCtx.now;
  const filter = req.user.role === 'partner' ? { _id: req.user.partnerId } : {};
  const partners = await FeePartner.find(filter).sort({ name: 1 });

  const refunds = await FeeRefund.find({ partnerId: { $in: partners.map((p) => p._id) } });
  const data = await Promise.all(
    partners.map(async (p) => {
      const students = await FeeStudent.find({ partnerId: p._id });
      return { ...p.toObject(), commission: commission(p, students, refunds, now) };
    })
  );

  res.json({ success: true, data });
});

/** @desc Partner detail + students + held/cleared/commission. @route GET /api/fees/partners/:id */
const getPartnerById = asyncHandler(async (req, res) => {
  if (req.user.role === 'partner' && String(req.params.id) !== String(req.user.partnerId)) {
    res.status(403);
    throw new Error('You can only view your own partner record.');
  }
  const partner = await FeePartner.findById(req.params.id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }
  const now = req.feeCtx.now;
  const students = await FeeStudent.find({ partnerId: partner._id }).populate('programId', 'name code');
  const refunds = await FeeRefund.find({ partnerId: partner._id });

  res.json({
    success: true,
    data: {
      ...partner.toObject(),
      commission: commission(partner, students, refunds, now),
      students: students.map((s) => serializeStudent(s, now)),
    },
  });
});

/** @desc Create a partner. @route POST /api/fees/partners @access admin/registrar */
const createPartner = asyncHandler(async (req, res) => {
  const partner = await FeePartner.create(pickFields(req.body));
  res.status(201).json({ success: true, data: partner });
});

/** @desc Update a partner. @route PUT /api/fees/partners/:id @access admin/registrar */
const updatePartner = asyncHandler(async (req, res) => {
  const partner = await FeePartner.findById(req.params.id);
  if (!partner) {
    res.status(404);
    throw new Error('Partner not found');
  }
  Object.assign(partner, pickFields(req.body));
  await partner.save();
  res.json({ success: true, data: partner });
});

module.exports = { getPartners, getPartnerById, createPartner, updatePartner };
