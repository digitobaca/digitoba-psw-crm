const { addDays } = require('../utils/dates');

const SERVICE_FEE_CAP_CENTS = 50000; // $500
const SERVICE_FEE_RATE = 0.2;
const MIDPOINT_FRACTION = 0.5;

const REASON_CITATIONS = {
  rescind: { label: 'Cancelled in writing within 2 days of receiving the contract', citation: 's. 25, full refund of all fees paid.' },
  before: { label: 'Withdrew before the program began (more than 2 days after signing)', citation: 's. 26, all fees except the service fee.' },
  visa: { label: 'International student could not obtain a study permit', citation: 's. 26 / s. 32, treated as a withdrawal.' },
  after: { label: 'Withdrew or was expelled after the program began', citation: 's. 27, partial refund only before the midpoint.' },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Refund calculator under Ontario Regulation 415/06 (BUILD PROMPT section
 * 4.5). Pure function, integer cents throughout. NOTE: these are
 * simplified, human-readable citations for the UI, not a substitute for
 * legal review — flagged again in the final report.
 *
 * @param {object} inputs
 * @param {number} inputs.paidCents - cleared instalments only
 * @param {number} inputs.programFeesCents - program.totalCents
 * @param {number} inputs.hoursTotal
 * @param {number} inputs.hoursDelivered
 * @param {'rescind'|'before'|'visa'|'after'} inputs.reason
 * @param {boolean} inputs.booksReturned
 * @param {number} inputs.booksCostCents
 * @param {number} inputs.commissionRatePct
 * @param {Date} inputs.noticeDate
 */
function refundCalc({
  paidCents,
  programFeesCents,
  hoursTotal,
  hoursDelivered,
  reason,
  booksReturned,
  booksCostCents = 0,
  commissionRatePct = 0,
  noticeDate,
}) {
  const serviceFeeCents = Math.min(Math.round(programFeesCents * SERVICE_FEE_RATE), SERVICE_FEE_CAP_CENTS);
  const frac = hoursTotal > 0 ? clamp(hoursDelivered / hoursTotal, 0, 1) : 0;
  const pastMidpoint = reason === 'after' && frac >= MIDPOINT_FRACTION;

  const retainServiceCents = reason === 'rescind' ? 0 : serviceFeeCents;
  const earnedCents = reason === 'after' ? Math.round(programFeesCents * frac) : 0;
  const booksCents = booksReturned ? 0 : booksCostCents;

  const refundCents = pastMidpoint ? 0 : Math.max(0, paidCents - retainServiceCents - earnedCents - booksCents);
  const clawbackCents = Math.round((refundCents * commissionRatePct) / 100);
  const dueBy = addDays(noticeDate, 30);

  return {
    serviceFeeCents,
    frac,
    pastMidpoint,
    retainServiceCents,
    earnedCents,
    booksCents,
    refundCents,
    clawbackCents,
    dueBy,
  };
}

module.exports = refundCalc;
module.exports.REASON_CITATIONS = REASON_CITATIONS;
module.exports.SERVICE_FEE_CAP_CENTS = SERVICE_FEE_CAP_CENTS;
