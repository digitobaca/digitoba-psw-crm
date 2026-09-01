const asyncHandler = require('express-async-handler');
const College = require('../models/College');

/** @desc List colleges (public sees only active+verified; staff sees everything). @route GET /api/colleges @access Public/Private */
const getColleges = asyncHandler(async (req, res) => {
  const filter = req.user ? {} : { isActive: true, verified: true };
  if (req.query.province) filter.province = req.query.province;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const colleges = await College.find(filter).sort({ name: 1 });
  res.json({ success: true, data: colleges });
});

/** @desc Get one college. @route GET /api/colleges/:id @access Public/Private */
const getCollegeById = asyncHandler(async (req, res) => {
  const college = await College.findById(req.params.id);
  if (!college || (!req.user && (!college.isActive || !college.verified))) {
    res.status(404);
    throw new Error('College not found');
  }
  res.json({ success: true, data: college });
});

/** @desc Create a college. @route POST /api/colleges @access Private (admin) */
const createCollege = asyncHandler(async (req, res) => {
  const college = await College.create(req.body);
  res.status(201).json({ success: true, data: college });
});

/** @desc Update a college — verifying it stamps verifiedBy/verifiedAt. @route PUT /api/colleges/:id @access Private (admin) */
const updateCollege = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.verified === true) {
    updates.verifiedBy = req.user._id;
    updates.verifiedAt = new Date();
  }

  const college = await College.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!college) {
    res.status(404);
    throw new Error('College not found');
  }
  res.json({ success: true, data: college });
});

/** @desc Delete a college. @route DELETE /api/colleges/:id @access Private (admin) */
const deleteCollege = asyncHandler(async (req, res) => {
  const college = await College.findByIdAndDelete(req.params.id);
  if (!college) {
    res.status(404);
    throw new Error('College not found');
  }
  res.json({ success: true, message: 'College deleted' });
});

module.exports = { getColleges, getCollegeById, createCollege, updateCollege, deleteCollege };
