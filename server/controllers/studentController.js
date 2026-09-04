const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const AdCampaign = require('../models/AdCampaign');
const { onboardNewLead } = require('../utils/onboardNewLead');

/**
 * @desc    Create a new student/lead record from any public form (consultation
 *          modal, PSW section, contact page, newsletter, Free Assessment,
 *          Eligibility Checker). Triggers the full onboarding automation chain.
 * @route   POST /api/students
 * @access  Public
 */
const createStudent = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'city',
    'country',
    'education',
    'intendedProgram',
    'preferredProvince',
    'message',
    'leadSource',
    'careerGoal',
    'immigrationStatus',
    'utmCampaign',
  ];
  const payload = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field];
  }

  // Ads Dashboard attribution: if the form's URL carried ?utm_campaign=<slug>
  // and it matches a campaign someone's already set up, link this lead to it
  // automatically — no manual re-tagging needed for the common case.
  if (payload.utmCampaign) {
    const campaign = await AdCampaign.findOne({ utmSlug: payload.utmCampaign.toLowerCase().trim() }).select('_id');
    if (campaign) payload.campaign = campaign._id;
  }

  const student = await Student.create({ ...payload, pipelineStage: 'New Lead' });

  const automation = await onboardNewLead(student);

  res.status(201).json({
    success: true,
    message: "Thank you! We've received your request and will be in touch shortly.",
    data: student,
    automation,
  });
});

/**
 * @desc    List students with pagination, search, and pipeline/source filters.
 *          Counsellors only see their own assigned students; admins see all.
 * @route   GET /api/students?page=&limit=&pipelineStage=&leadSource=&search=&unassigned=true
 * @access  Private
 */
const getStudents = asyncHandler(async (req, res) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  const { pipelineStage, leadSource, search, unassigned } = req.query;

  const filter = { ...req.scopeFilter };
  if (pipelineStage) filter.pipelineStage = pipelineStage;
  if (leadSource) filter.leadSource = leadSource;
  if (unassigned === 'true') filter.assignedCounsellor = null;
  if (search) {
    const regex = new RegExp(search.trim(), 'i');
    filter.$or = [{ name: regex }, { email: regex }, { phone: regex }];
  }

  const [students, total] = await Promise.all([
    Student.find(filter)
      .populate('assignedCounsellor', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Student.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: students,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

/** @desc Get a single student (scoped to the requesting counsellor). @route GET /api/students/:id @access Private */
const getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ _id: req.params.id, ...req.scopeFilter }).populate(
    'assignedCounsellor',
    'name email'
  );
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json({ success: true, data: student });
});

/**
 * @desc    Update a student's profile/pipeline stage. Per the CRM's intended
 *          workflow (book consultation → assign counsellor → contact →
 *          student fills profile → documents → submit for review → admin
 *          reviews and manages the Application through to admission), a
 *          counsellor can move a case up to "Submitted for Review" — moving
 *          it further is an admin action. Closed (lost) is exempt; a
 *          counsellor can always mark a dead lead closed.
 * @route   PUT /api/students/:id
 * @access  Private
 */
const updateStudent = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'email',
    'phone',
    'city',
    'country',
    'dateOfBirth',
    'gender',
    'address',
    'education',
    'intendedProgram',
    'message',
    'immigrationStatus',
    'educationHistory',
    'testScores',
    'workExperience',
    'financialProfile',
    'careerGoal',
    'preferredProvince',
    'programPreferences',
    'collegeShortlist',
    'pipelineStage',
    'leadSource',
    'campaign',
    'assignedCounsellor',
    'followUpDate',
    'notes',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const existing = await Student.findOne({ _id: req.params.id, ...req.scopeFilter }).select('_id');
  if (!existing) {
    res.status(404);
    throw new Error('Student not found');
  }

  const student = await Student.findOneAndUpdate({ _id: req.params.id, ...req.scopeFilter }, updates, {
    new: true,
    runValidators: true,
  });

  res.json({ success: true, data: student });
});

/** @desc Append a timestamped counsellor note. @route POST /api/students/:id/notes @access Private */
const addStudentNote = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400);
    throw new Error('Note text is required');
  }

  const student = await Student.findOneAndUpdate(
    { _id: req.params.id, ...req.scopeFilter },
    { $push: { counsellorNotes: { author: req.user._id, text: text.trim() } } },
    { new: true, runValidators: true }
  ).populate('counsellorNotes.author', 'name');

  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }

  res.status(201).json({ success: true, data: student });
});

/** @desc Delete a student record. @route DELETE /api/students/:id @access Private (admin only) */
const deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) {
    res.status(404);
    throw new Error('Student not found');
  }
  res.json({ success: true, message: 'Student deleted' });
});

module.exports = { createStudent, getStudents, getStudentById, updateStudent, addStudentNote, deleteStudent };
