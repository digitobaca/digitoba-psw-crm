const asyncHandler = require('express-async-handler');
const Student = require('../models/Student');
const Document = require('../models/Document');
const Application = require('../models/Application');
const Payment = require('../models/Payment');
const CommunicationLog = require('../models/CommunicationLog');
const { saveUploadedFile } = require('../utils/storage');

/**
 * Read/write endpoints for the student self-service portal. Every handler
 * here scopes to `req.student._id` (set by protectStudent) rather than
 * trusting any student id from the request — a student can only ever see
 * or modify their own record.
 */

/** @desc Get the logged-in student's full profile. @route GET /api/portal/profile @access Private (student) */
const getMyProfile = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.student._id).populate('assignedCounsellor', 'name email phone');
  res.json({ success: true, data: student });
});

/** @desc Student completes/edits their own profile. @route PUT /api/portal/profile @access Private (student) */
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'city',
    'country',
    'dateOfBirth',
    'gender',
    'address',
    'educationHistory',
    'testScores',
    'workExperience',
    'financialProfile',
    'careerGoal',
    'preferredProvince',
    'programPreferences',
  ];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const student = await Student.findByIdAndUpdate(req.student._id, updates, { new: true, runValidators: true });

  // Moving out of "New Lead"/"Contacted" once the student has filled in
  // their profile is a reasonable automatic nudge along the pipeline.
  if (['New Lead', 'Contacted', 'Qualified'].includes(student.pipelineStage)) {
    student.pipelineStage = 'Profile Complete';
    await student.save();
  }

  res.json({ success: true, data: student });
});

/** @desc List the student's own documents (with missing-document gaps for common types). @route GET /api/portal/documents @access Private (student) */
const getMyDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ student: req.student._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

/** @desc Student uploads their own document. @route POST /api/portal/documents @access Private (student) */
const uploadMyDocument = asyncHandler(async (req, res) => {
  const { type } = req.body;
  if (!type) {
    res.status(400);
    throw new Error('Document type is required');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  const existing = await Document.findOne({ student: req.student._id, type }).sort({ version: -1 });
  const version = existing ? existing.version + 1 : 1;
  const fileUrl = await saveUploadedFile(req.file);

  const document = await Document.create({
    student: req.student._id,
    type,
    status: 'Uploaded',
    fileUrl,
    originalFilename: req.file.originalname,
    version,
    uploadedAt: new Date(),
  });

  res.status(201).json({ success: true, data: document });
});

/** @desc List the student's own applications. @route GET /api/portal/applications @access Private (student) */
const getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ student: req.student._id })
    .populate('college', 'name province website')
    .populate('program', 'name level tuitionAmount tuitionCurrency')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
});

/** @desc List the student's own payments/invoices. @route GET /api/portal/payments @access Private (student) */
const getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ student: req.student._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: payments });
});

/**
 * @desc    Get the student's chat thread with their counsellor. Scoped to
 *          `channel: 'Note'` with no `contactStatus` — that's the actual
 *          back-and-forth chat, kept separate from a counsellor's internal
 *          "outcome of this call" logs (which have a contactStatus and are
 *          never meant for the student to see verbatim).
 * @route   GET /api/portal/messages
 * @access  Private (student)
 */
const getMyMessages = asyncHandler(async (req, res) => {
  const messages = await CommunicationLog.find({ student: req.student._id, channel: 'Note', contactStatus: null })
    .populate('counsellor', 'name')
    .sort({ createdAt: 1 });
  res.json({ success: true, data: messages });
});

/** @desc Student sends a message to their counsellor. @route POST /api/portal/messages @access Private (student) */
const sendMyMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400);
    throw new Error('Message is required');
  }

  const student = await Student.findById(req.student._id);
  const log = await CommunicationLog.create({
    student: req.student._id,
    counsellor: student.assignedCounsellor,
    channel: 'Note',
    direction: 'Inbound',
    message: message.trim(),
    deliveryStatus: 'logged',
  });

  res.status(201).json({ success: true, data: log });
});

module.exports = {
  getMyProfile,
  updateMyProfile,
  getMyDocuments,
  uploadMyDocument,
  getMyApplications,
  getMyPayments,
  getMyMessages,
  sendMyMessage,
};
