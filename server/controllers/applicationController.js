const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const Student = require('../models/Student');

/** @desc List applications, optionally filtered by student/stage. Counsellors are scoped to their students. @route GET /api/applications @access Private */
const getApplications = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.stage) filter.stage = req.query.stage;

  // Counsellors only see applications for students assigned to them.
  if (req.user.role === 'counsellor') {
    const myStudentIds = await Student.find({ assignedCounsellor: req.user._id }).distinct('_id');
    filter.student = filter.student ? filter.student : { $in: myStudentIds };
  }

  const applications = await Application.find(filter)
    .populate('student', 'name email phone')
    .populate('college', 'name province')
    .populate('program', 'name level')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: applications });
});

/** @desc Get one application (counsellors scoped to their own students'). @route GET /api/applications/:id @access Private */
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('student', 'name email phone assignedCounsellor')
    .populate('college', 'name province')
    .populate('program', 'name level tuitionAmount tuitionCurrency')
    .populate('history.changedBy', 'name');
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  if (req.user.role === 'counsellor' && application.student?.assignedCounsellor?.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this application');
  }
  res.json({ success: true, data: application });
});

/** @desc Create an application (college selected for a student). @route POST /api/applications @access Private (admin) */
const createApplication = asyncHandler(async (req, res) => {
  const { student, college, program, intake } = req.body;

  const application = await Application.create({
    student,
    college,
    program,
    intake,
    stage: 'College Selected',
    history: [{ stage: 'College Selected', changedBy: req.user._id }],
  });

  // Keep the student's CRM-wide pipeline stage in step with the fact that an
  // Application now exists for them — only moves it forward, same rule as
  // every other automatic nudge along the pipeline (see portalController's
  // profile-completion bump). "Interested" is the closest forward-pipeline
  // signal to "an application now exists for this lead".
  const studentDoc = await Student.findById(student).select('pipelineStage');
  if (studentDoc) {
    const stageIndex = Student.PIPELINE_STAGES.indexOf(studentDoc.pipelineStage);
    const interestedIndex = Student.PIPELINE_STAGES.indexOf('Interested');
    if (stageIndex !== -1 && stageIndex < interestedIndex) {
      studentDoc.pipelineStage = 'Interested';
      await studentDoc.save();
    }
  }

  res.status(201).json({ success: true, data: application });
});

/**
 * @desc    Update an application's stage/details — every stage change is
 *          appended to history. Fully admin-managed: stage progression,
 *          application number, and admission details (start date, offer/LOA
 *          notes) once the college confirms.
 * @route   PUT /api/applications/:id
 * @access  Private (admin)
 */
const updateApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const previousStage = application.stage; // capture before the field loop mutates it below

  const allowedFields = [
    'stage',
    'applicationNumber',
    'intake',
    'submittedAt',
    'decisionAt',
    'notes',
    'admissionStartDate',
    'admissionDetails',
  ];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) application[field] = req.body[field];
  }

  if (req.body.stage && req.body.stage !== previousStage) {
    application.history.push({ stage: req.body.stage, changedBy: req.user._id, note: req.body.note || '' });
  }

  await application.save();
  res.json({ success: true, data: application });
});

/** @desc Delete an application. @route DELETE /api/applications/:id @access Private (admin) */
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await Application.findByIdAndDelete(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }
  res.json({ success: true, message: 'Application deleted' });
});

module.exports = { getApplications, getApplicationById, createApplication, updateApplication, deleteApplication };
