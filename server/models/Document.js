const mongoose = require('mongoose');

/**
 * Phase 1 document handling per spec: upload, categorize, track status,
 * flag missing/expiring documents. Deliberately NOT doing OCR/AI
 * classification or fraud detection yet — that's an explicit later phase.
 */
const DOCUMENT_TYPES = [
  'Passport',
  '10th Marksheet',
  '12th Marksheet',
  'Bachelor Degree',
  'Master Degree',
  'Transcript',
  'IELTS',
  'PTE',
  'CELPIP',
  'TOEFL',
  'Resume',
  'Statement of Purpose',
  'Bank Statement',
  'Sponsorship Letter',
  'Work Experience Letter',
  'Passport Photo',
  'Other',
];

const DOCUMENT_STATUSES = ['Pending', 'Uploaded', 'Verified', 'Rejected', 'Expired'];

const DocumentSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null }, // optional: tie to a specific application

    type: { type: String, enum: DOCUMENT_TYPES, required: true },
    status: { type: String, enum: DOCUMENT_STATUSES, default: 'Pending' },

    // Local disk storage path for Phase 1 (see server/uploads/) — swap
    // fileUrl for an S3/Cloud Storage URL later without changing the schema.
    fileUrl: { type: String, trim: true, default: '' },
    originalFilename: { type: String, trim: true, default: '' },
    version: { type: Number, default: 1 },

    expiryDate: Date,
    uploadedAt: Date,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: Date,

    comments: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

DocumentSchema.index({ student: 1 });
DocumentSchema.index({ status: 1 });

DocumentSchema.statics.TYPES = DOCUMENT_TYPES;
DocumentSchema.statics.STATUSES = DOCUMENT_STATUSES;

module.exports = mongoose.model('Document', DocumentSchema);
