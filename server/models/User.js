const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Internal team accounts: admin (full CRM + analytics access) and counsellor
// (scoped to their assigned students only — enforced in middleware/scopeToCounsellor).
const ROLES = ['admin', 'counsellor'];

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
