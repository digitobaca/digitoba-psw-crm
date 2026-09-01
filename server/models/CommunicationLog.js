const mongoose = require('mongoose');

/**
 * Every touchpoint with a student — email, WhatsApp, SMS, call, or a manual
 * note — recorded in one timeline per the spec's "Student contacted → Message
 * → Counsellor → Date/time → Outcome → Next follow-up" flow. Outbound
 * WhatsApp/SMS sends go through utils/messaging.js, which both sends (once a
 * real provider is configured) AND writes the log entry here.
 */
const CommunicationLogSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    counsellor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    channel: {
      type: String,
      enum: ['Email', 'WhatsApp', 'SMS', 'Call', 'Note'],
      required: true,
    },
    direction: {
      type: String,
      enum: ['Outbound', 'Inbound'],
      default: 'Outbound',
    },
    // Set when a counsellor quick-logs a contact attempt from the student's
    // record (channel is usually 'Call' or 'Note' for these). `message` is
    // required by the route validator only when contactStatus is
    // 'Contacted' — there's nothing to say for a failed attempt.
    contactStatus: {
      type: String,
      enum: ['Contacted', 'Not Contacted', 'No Response'],
      default: null,
    },
    message: { type: String, trim: true, default: '', maxlength: 4000 },
    outcome: { type: String, trim: true, default: '' },
    nextFollowUpDate: Date,

    // Only meaningful for Inbound chat messages (a student writing in).
    // Set the moment any counsellor/admin opens that student's chat thread —
    // shared read-state across the team, not per-user, since the whole point
    // is a counsellor and an admin can both be looking at the same inbox.
    readAt: { type: Date, default: null },

    // For provider-sent messages: 'sent' once a real API confirms delivery,
    // 'logged' when running on the stub (no provider configured yet).
    deliveryStatus: {
      type: String,
      enum: ['logged', 'sent', 'failed'],
      default: 'logged',
    },
  },
  { timestamps: true }
);

CommunicationLogSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('CommunicationLog', CommunicationLogSchema);
