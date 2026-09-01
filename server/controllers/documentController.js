const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const Student = require('../models/Student');

/** Counsellors may only touch documents belonging to their own assigned students. */
const assertOwnsStudent = async (req, studentId) => {
  if (req.user.role !== 'counsellor') return;
  const owned = await Student.exists({ _id: studentId, assignedCounsellor: req.user._id });
  if (!owned) {
    const err = new Error('Not authorized for this student\'s documents');
    err.statusCode = 403;
    throw err;
  }
};

/** @desc List a student's documents (counsellors scoped to their own students). @route GET /api/documents?student=:id @access Private */
const getDocuments = asyncHandler(async (req, res) => {
  if (req.query.student) {
    try {
      await assertOwnsStudent(req, req.query.student);
    } catch (err) {
      res.status(err.statusCode || 403);
      throw err;
    }
  } else if (req.user.role === 'counsellor') {
    // No student filter given — restrict to their own students rather than
    // silently returning the whole team's documents.
    const myIds = await Student.find({ assignedCounsellor: req.user._id }).distinct('_id');
    const documents = await Document.find({ student: { $in: myIds } })
      .populate('verifiedBy', 'name')
      .populate('comments.author', 'name')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: documents });
  }

  const filter = {};
  if (req.query.student) filter.student = req.query.student;
  if (req.query.status) filter.status = req.query.status;

  const documents = await Document.find(filter)
    .populate('verifiedBy', 'name')
    .populate('comments.author', 'name')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: documents });
});

/**
 * @desc    Upload a document file for a student. Creates a new version if a
 *          document of the same type already exists for that student.
 * @route   POST /api/documents
 * @access  Private
 */
const uploadDocument = asyncHandler(async (req, res) => {
  const { student, type, application, expiryDate } = req.body;

  if (!student || !type) {
    res.status(400);
    throw new Error('student and type are required');
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }

  try {
    await assertOwnsStudent(req, student);
  } catch (err) {
    res.status(err.statusCode || 403);
    throw err;
  }

  const existing = await Document.findOne({ student, type }).sort({ version: -1 });
  const version = existing ? existing.version + 1 : 1;

  const document = await Document.create({
    student,
    application: application || null,
    type,
    status: 'Uploaded',
    fileUrl: `/uploads/${req.file.filename}`,
    originalFilename: req.file.originalname,
    version,
    expiryDate: expiryDate || undefined,
    uploadedAt: new Date(),
  });

  res.status(201).json({ success: true, data: document });
});

/** @desc Update a document's status (e.g. Verified/Rejected) or add a comment. @route PUT /api/documents/:id @access Private */
const updateDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  try {
    await assertOwnsStudent(req, document.student);
  } catch (err) {
    res.status(err.statusCode || 403);
    throw err;
  }

  const { status, expiryDate, comment } = req.body;
  if (status) {
    document.status = status;
    if (status === 'Verified') {
      document.verifiedBy = req.user._id;
      document.verifiedAt = new Date();
    }
  }
  if (expiryDate !== undefined) document.expiryDate = expiryDate;
  if (comment) document.comments.push({ author: req.user._id, text: comment });

  await document.save();
  await document.populate([
    { path: 'verifiedBy', select: 'name' },
    { path: 'comments.author', select: 'name' },
  ]);
  res.json({ success: true, data: document });
});

/** @desc Delete a document record (and its stored file reference). @route DELETE /api/documents/:id @access Private */
const deleteDocument = asyncHandler(async (req, res) => {
  const document = await Document.findById(req.params.id);
  if (!document) {
    res.status(404);
    throw new Error('Document not found');
  }

  try {
    await assertOwnsStudent(req, document.student);
  } catch (err) {
    res.status(err.statusCode || 403);
    throw err;
  }

  await document.deleteOne();
  res.json({ success: true, message: 'Document deleted' });
});

module.exports = { getDocuments, uploadDocument, updateDocument, deleteDocument };
