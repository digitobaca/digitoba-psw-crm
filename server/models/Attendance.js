const mongoose = require('mongoose');

/**
 * One record per work shift for a staff member (admin/counsellor).
 * A shift starts automatically the moment they log in ("Shift Start") and
 * ends when they log out, at which point they're asked what they got done
 * ("Shift End" + daily summary). If a session just expires/the browser is
 * closed without an explicit logout, the shift is left `Active` with no
 * `shiftEnd` — the admin Attendance view surfaces that honestly rather than
 * silently closing it.
 */
const AttendanceSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shiftStart: { type: Date, required: true, default: Date.now },
    shiftEnd: { type: Date, default: null },
    durationMinutes: { type: Number, default: null },
    summary: { type: String, trim: true, maxlength: 2000, default: '' }, // "what did you get done today"
    status: {
      type: String,
      enum: ['Active', 'Completed'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

AttendanceSchema.index({ user: 1, shiftStart: -1 });
AttendanceSchema.index({ status: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);
