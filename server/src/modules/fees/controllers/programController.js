const asyncHandler = require('express-async-handler');
const FeeProgram = require('../models/FeeProgram');
const FeeStudent = require('../models/FeeStudent');

const PROGRAM_FIELDS = [
  'code',
  'name',
  'type',
  'durationShort',
  'durationFull',
  'hoursTotal',
  'feeLines',
  'totalCents',
  'selfFundingCents',
  'intlSurchargeCents',
  'instalmentTemplate',
  'planLabel',
  'planNote',
  'clearBeforeDays',
  'admissionRequirements',
  'nocCode',
  'nocFull',
  'teer',
  'expressEntryEligible',
  'placement',
  'jobAssistance',
  'schedule',
  'bonus',
  'bjoNote',
  'active',
];

function pickFields(body) {
  const payload = {};
  for (const field of PROGRAM_FIELDS) {
    if (body[field] !== undefined) payload[field] = body[field];
  }
  return payload;
}

/** @desc List programs. @route GET /api/fees/programs @access All fee roles */
const getPrograms = asyncHandler(async (req, res) => {
  const programs = await FeeProgram.find().sort({ name: 1 });
  const counts = await FeeStudent.aggregate([{ $group: { _id: '$programId', count: { $sum: 1 } } }]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));
  const data = programs.map((p) => ({ ...p.toObject(), enrolledCount: countMap.get(String(p._id)) || 0 }));
  res.json({ success: true, data });
});

/** @desc Program detail + enrolled count. @route GET /api/fees/programs/:id @access All fee roles */
const getProgramById = asyncHandler(async (req, res) => {
  const program = await FeeProgram.findById(req.params.id);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  const enrolledCount = await FeeStudent.countDocuments({ programId: program._id });
  res.json({ success: true, data: { ...program.toObject(), enrolledCount } });
});

/** @desc Create a program. @route POST /api/fees/programs @access admin/registrar */
const createProgram = asyncHandler(async (req, res) => {
  const program = await FeeProgram.create(pickFields(req.body));
  res.status(201).json({ success: true, data: program });
});

/** @desc Update a program. @route PUT /api/fees/programs/:id @access admin/registrar */
const updateProgram = asyncHandler(async (req, res) => {
  const program = await FeeProgram.findById(req.params.id);
  if (!program) {
    res.status(404);
    throw new Error('Program not found');
  }
  Object.assign(program, pickFields(req.body));
  await program.save();
  res.json({ success: true, data: program });
});

module.exports = { getPrograms, getProgramById, createProgram, updateProgram };
