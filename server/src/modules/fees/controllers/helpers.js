const effectiveStatus = require('../services/effectiveStatus');
const sums = require('../services/sums');

/** Adds `effectiveStatus` to every instalment and the student's `sums` — used by every response that includes a student's ledger. */
function serializeStudent(student, now = new Date()) {
  const obj = typeof student.toObject === 'function' ? student.toObject() : student;
  const instalments = (obj.instalments || []).map((inst, index) => ({
    ...inst,
    index,
    effectiveStatus: effectiveStatus(inst, now),
  }));
  return { ...obj, instalments, sums: sums(obj.instalments, now) };
}

/** Small helper so route handlers can catch a thrown HttpError (statusCode) and translate it to res.status()+throw, matching the repo's asyncHandler convention. */
function applyHttpError(res, err) {
  if (err && err.statusCode) {
    res.status(err.statusCode);
  }
  throw err;
}

module.exports = { serializeStudent, applyHttpError };
