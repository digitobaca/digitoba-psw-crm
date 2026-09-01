const User = require('../models/User');

/**
 * Least-loaded assignment: picks the active counsellor currently carrying
 * the fewest active students and increments their counter. Falls back to
 * leaving the student unassigned if no counsellors exist yet (e.g. a fresh
 * install before the first counsellor account is seeded) — the admin
 * dashboard surfaces "Unassigned" leads so nothing gets silently dropped.
 */
const autoAssignCounsellor = async () => {
  const counsellor = await User.findOneAndUpdate(
    { role: 'counsellor', isActive: true },
    { $inc: { activeStudentCount: 1 } },
    { sort: { activeStudentCount: 1 }, new: true }
  );

  return counsellor ? counsellor._id : null;
};

module.exports = { autoAssignCounsellor };
