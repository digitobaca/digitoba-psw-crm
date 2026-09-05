const effectiveStatus = require('./effectiveStatus');
const { daysBetween } = require('../utils/dates');

/**
 * Per-partner commission rollup (BUILD PROMPT section 4.4). Commission
 * accrues ONLY on cleared instalments of that partner's `intl` students —
 * never on `self` or `bjo` students, even if they happen to share a
 * partnerId (which they shouldn't per the model, but this stays defensive).
 *
 * @param {object} partner - FeePartner doc/plain object (needs commissionRatePct, remitWindowDays)
 * @param {object[]} students - FeeStudent docs/plain objects belonging to this partner
 * @param {object[]} refunds - FeeRefund docs/plain objects (only clawbackCents + partnerId used)
 * @param {Date} now
 */
function commission(partner, students, refunds, now = new Date()) {
  let confirmedVolumeCents = 0; // sum of cleared amountCents on intl students
  let accruedCents = 0;
  let heldCents = 0;
  let oldestHeldOn = null;

  students
    .filter((s) => s.fundingType === 'intl')
    .forEach((student) => {
      (student.instalments || []).forEach((inst) => {
        if (inst.cancelled) return;
        const status = effectiveStatus(inst, now);
        if (status === 'cleared') {
          confirmedVolumeCents += inst.amountCents;
        } else if (status === 'agent' || status === 'transit') {
          heldCents += inst.reportedCents != null ? inst.reportedCents : inst.amountCents;
          if (inst.collectedOn && (!oldestHeldOn || new Date(inst.collectedOn) < new Date(oldestHeldOn))) {
            oldestHeldOn = inst.collectedOn;
          }
        }
      });
    });

  accruedCents = Math.round((confirmedVolumeCents * partner.commissionRatePct) / 100);

  const clawbackCents = refunds
    .filter((r) => String(r.partnerId) === String(partner._id))
    .reduce((sum, r) => sum + r.clawbackCents, 0);

  const netPayableCents = accruedCents - clawbackCents;
  const oldestHeldDays = oldestHeldOn ? daysBetween(oldestHeldOn, now) : 0;
  const late = oldestHeldDays > partner.remitWindowDays;

  return {
    partnerId: partner._id,
    confirmedVolumeCents,
    accruedCents,
    clawbackCents,
    netPayableCents,
    heldCents,
    oldestHeldDays,
    late,
    studentCount: students.length,
  };
}

module.exports = commission;
