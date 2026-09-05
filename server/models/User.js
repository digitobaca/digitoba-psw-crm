const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Internal team accounts: admin (full CRM + analytics access) and counsellor
// (scoped to their assigned students only — enforced in middleware/scopeToCounsellor).
// 'registrar' and 'partner' were added for the Fee Ledger module
// (server/src/modules/fees/) — registrar is college finance/admissions staff
// (can confirm cash), partner is a recruitment agent scoped to their own
// FeePartner's students via the partnerId field below. Both log in through
// the same /admin/login track as admin/counsellor; there is no separate login.
const ROLES = ['admin', 'counsellor', 'registrar', 'partner'];

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'counsellor',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Used by the round-robin auto-assignment algorithm to distribute new
    // leads evenly across active counsellors.
    activeStudentCount: {
      type: Number,
      default: 0,
    },
    // Only meaningful when role === 'partner' — links this login to the
    // FeePartner (recruitment agent) whose students/commission it can see.
    // See server/src/modules/fees/models/FeePartner.js.
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeePartner',
      default: null,
    },
  },
  { timestamps: true }
);

// Hash the password whenever it's set/changed.
UserSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', UserSchema);
