const asyncHandler = require('express-async-handler');
const Program = require('../models/Program');

/** @desc List programs, optionally filtered by college/level/field. Public sees only verified+active. @route GET /api/programs @access Public/Private */
const getPrograms = asyncHandler(async (req, res) => {
  const filter = req.user ? {} : { isActive: true, verified: true };
  if (req.query.college) filter.college = req.query.college;
  if (req.query.level) filter.level = req.query.level;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const programs = await Program.find(filter).populate('college', 'name province campuses verified').sort({ name: 1 });
  res.json({ success: true, data: programs });
});

/** @desc Get one program. @route GET /api/programs/:id @access Public/Private */
const getProgramById = asyncHandler(async (req, res) => {
  const program = await Program.findById(req.params.id).populate('college', 'name province campuses website verified');
  if (!program || (!req.user && (!program.isActive || !program.verified))) {
    res.status(404);
    throw new Error('Program not found');
  }
  res.json({ success: true, data: program });
});

/** @desc Create a program. @route POST /api/programs @access Private (admin) */
const createProgram = asyncHandler(async (req, res) => {
  const program = await Program.create(req.body);
  res.status(201).json({ success: true, data: program });
});

/** @desc Update a program — verifying it stamps verifiedBy/verifiedAt. @route PUT /api/programs/:id @access Private (admin) */
const updateProgram = asyncHandler(async (req, res) => {
  const updates = { ...req.body };
  if (updates.verified === true) {
    updates.verifiedBy = req.user._id;
    updates.verifiedAt = new Date();
  }

  const program = await Program.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  res.json({ success: true, data: program });
});

/** @desc Delete a program. @route DELETE /api/programs/:id @access Private (admin) */
const deleteProgram = asyncHandler(async (req, res) => {
  const program = await Program.findByIdAndDelete(req.params.id);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  res.json({ success: true, message: 'Program deleted' });
});

module.exports = { getPrograms, getProgramById, createProgram, updateProgram, deleteProgram };
