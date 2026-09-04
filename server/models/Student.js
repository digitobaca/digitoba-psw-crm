const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * The central CRM record. A record is created the moment someone submits any
 * public form (consultation modal, PSW section, contact page, newsletter, or
 * the new Free Assessment / Eligibility Checker) — at that point it's a thin
 * "New Lead". As a counsellor works it, the SAME record accumulates the
 * richer profile fields below and advances through `pipelineStage`. This
 * mirrors how real CRMs (HubSpot, Salesforce) model a contact: one evolving
 * record, not a separate "Lead" and "Student" collection kept in sync.
 *
 * Both business verticals (the PSW pathway and the India-focused general
 * study-in-Canada recruitment) share this single pipeline — `leadSource` and
 * `intendedProgram` distinguish which vertical a record came from.
 */

// Forward, ordered lead-qualification pipeline — both roles can move a case
// freely through these (no counsellor→admin handoff gate; that only made
// sense for the old, longer application-tracking pipeline this replaced).
// A separate `Application` record (see models/Application.js) tracks the
// actual college-application/visa process once a lead is serious.
const PIPELINE_STAGES = [
  'New Lead',
  'Cold Attempt 1',
  'Cold Attempt 2',
  'Cold Attempt 3',
  'Warm Lead',
  'Hot Lead',
  'Interested',
  'Enrolled',
];

// Side/terminal outcomes — not part of forward progress, so they're excluded
// from PIPELINE_STAGES's index-based "how far along" math (see
// adCampaignController/analyticsController's use of stageIndex/countByStages).
// A lead can land on one of these from any point in the forward pipeline.
const TERMINAL_STAGES = ['Not Interested', 'Counselled Not Enrolled', 'Hold Lead', 'BJO'];

// Current immigration status in Canada, captured on the consultation form.
const IMMIGRATION_STATUSES = ['Work Permit', 'Study Permit', 'PR / Citizen', 'Refugee Claimant'];

const LEAD_SOURCES = [
  // India / general study-in-Canada vertical
  'google_ads',
  'meta_ads',
  'website',
  'whatsapp',
  'instagram',
  'youtube',
  'referral',
  'walk_in',
  'school_partnership',
  'manual',
  // Existing PSW-vertical / marketing-site form sources
  'consultation_form',
  'psw_section',
  'contact_page',
  'newsletter',
  'other',
];

const EducationHistorySchema = new mongoose.Schema(
  {
    level: { type: String, trim: true }, // e.g. "10th", "12th", "Bachelor's", "Master's"
    institution: { type: String, trim: true },
    board: { type: String, trim: true }, // board/university name
    yearOfCompletion: { type: Number },
    percentage: { type: String, trim: true }, // kept as string to allow "8.2 CGPA" or "85%"
  },
  { _id: false }
);

const TestScoreSchema = new mongoose.Schema(
  {
    listening: Number,
    reading: Number,
    writing: Number,
    speaking: Number,
    overall: Number,
    testDate: Date,
  },
  { _id: false }
);

const WorkExperienceSchema = new mongoose.Schema(
  {
    company: { type: String, trim: true },
    role: { type: String, trim: true },
    from: Date,
    to: Date,
    description: { type: String, trim: true },
  },
  { _id: false }
);

const ProgramPreferenceSchema = new mongoose.Schema(
  {
    level: { type: String, trim: true }, // Diploma / Bachelor's / Master's / PSW Certificate
    field: { type: String, trim: true },
    intake: { type: String, trim: true }, // e.g. "Fall 2026"
  },
  { _id: false }
);

const CollegeShortlistItemSchema = new mongoose.Schema(
  {
    college: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
    program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' },
    status: {
      type: String,
      enum: ['Considering', 'Shortlisted', 'Applying', 'Rejected'],
      default: 'Considering',
    },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const CounsellorNoteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, trim: true, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

const StudentSchema = new mongoose.Schema(
  {
    // --- Personal information -------------------------------------------------
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [30, 'Phone number looks too long'],
    },
    city: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' }, // country of residence
    dateOfBirth: Date,
    gender: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },

    // --- Quick-capture fields (used by the existing simple public forms) ------
    education: { type: String, trim: true, maxlength: 150, default: '' }, // e.g. "Bachelor's Degree"
    intendedProgram: { type: String, trim: true, maxlength: 150, default: 'General Inquiry' },
    message: { type: String, trim: true, maxlength: 2000, default: '' },
    // Current immigration status in Canada, captured on the consultation
    // form — a large share of leads are already in Canada on some status
    // (student, worker, refugee claimant) looking to transition, so this is
    // a genuine qualifying question, not just profile trivia.
    immigrationStatus: {
      type: String,
      enum: [...IMMIGRATION_STATUSES, ''],
      default: '',
    },

    // --- Rich CRM profile (filled in over time by counsellor or the student) --
    educationHistory: [EducationHistorySchema],
    testScores: {
      ielts: TestScoreSchema,
      pte: TestScoreSchema,
      celpip: TestScoreSchema,
      toefl: TestScoreSchema,
    },
    workExperience: [WorkExperienceSchema],
    financialProfile: {
      budgetAmount: Number,
      budgetCurrency: { type: String, default: 'CAD' },
      fundSource: { type: String, trim: true, default: '' },
      sponsorDetails: { type: String, trim: true, default: '' },
    },
    careerGoal: { type: String, trim: true, default: '' },
    preferredProvince: { type: String, trim: true, default: '' },
    programPreferences: [ProgramPreferenceSchema],
    collegeShortlist: [CollegeShortlistItemSchema],

    // --- CRM pipeline -----------------------------------------------------------
    pipelineStage: {
      type: String,
      enum: [...PIPELINE_STAGES, ...TERMINAL_STAGES],
      default: 'New Lead',
    },
    leadSource: {
      type: String,
      enum: LEAD_SOURCES,
      default: 'website',
    },
    leadScore: { type: Number, default: 0, min: 0, max: 100 },
    assignedCounsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    followUpDate: Date,

    // --- Ads Dashboard attribution ------------------------------------------------
    // Auto-linked at creation time from `utmCampaign` matching an
    // AdCampaign.utmSlug (see studentController.createStudent) — or set/
    // corrected by hand in the CRM. Kept separate from `leadSource` (a
    // coarse channel like "meta_ads") since one channel can run several
    // distinct campaigns at once.
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'AdCampaign', default: null },
    // Raw ?utm_campaign= value captured off the public form's URL, kept
    // verbatim even if it didn't match any known campaign — so nothing is
    // silently lost if a campaign is created in the dashboard after the ad
    // already started running.
    utmCampaign: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' }, // quick single note (legacy)
    counsellorNotes: [CounsellorNoteSchema], // full timestamped note history

    // Denormalized from the latest CommunicationLog with a contactStatus set
    // (see controllers/communicationController.js) — kept here so the admin
    // students table can show "Last Contact" without an extra query per row.
    lastContactStatus: {
      type: String,
      enum: ['Contacted', 'Not Contacted', 'No Response', null],
      default: null,
    },
    lastContactAt: { type: Date, default: null },

    // Stamped whenever a counsellor hands the case to "Submitted for Review"
    // — lets the admin queue show how long something has been waiting.
    submittedForReviewAt: { type: Date, default: null },

    // --- Student portal authentication -----------------------------------------
    portalPassword: { type: String, select: false },
    portalActive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash the portal password whenever it's set/changed (same pattern as User).
StudentSchema.pre('save', async function hashPortalPassword(next) {
  if (!this.isModified('portalPassword') || !this.portalPassword) return next();
  const salt = await bcrypt.genSalt(12);
  this.portalPassword = await bcrypt.hash(this.portalPassword, salt);
  next();
});

StudentSchema.methods.comparePortalPassword = function comparePortalPassword(candidate) {
  return bcrypt.compare(candidate, this.portalPassword);
};

StudentSchema.index({ createdAt: -1 });
StudentSchema.index({ pipelineStage: 1 });
StudentSchema.index({ assignedCounsellor: 1 });
StudentSchema.index({ leadSource: 1 });
StudentSchema.index({ name: 'text', email: 'text', phone: 'text' });

StudentSchema.statics.PIPELINE_STAGES = PIPELINE_STAGES;
StudentSchema.statics.TERMINAL_STAGES = TERMINAL_STAGES;
StudentSchema.statics.LEAD_SOURCES = LEAD_SOURCES;
StudentSchema.statics.IMMIGRATION_STATUSES = IMMIGRATION_STATUSES;

module.exports = mongoose.model('Student', StudentSchema);
