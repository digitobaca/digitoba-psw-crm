const effectiveStatus = require('./effectiveStatus');

/**
 * Aggregates one student's instalments into the numbers the ledger UI shows.
 * See BUILD PROMPT section 4.2. Cancelled instalments (withdrawn students)
 * are excluded from every bucket except `total`, which still reflects the
 * original invoiced plan.
 */
function sums(instalments, now = new Date()) {
  let totalCents = 0;
  let clearedCents = 0;
  let heldCents = 0; // agent + transit
  let funderCents = 0;
  let outstandingCents = 0; // due + overdue
  let overdueCents = 0;

  let nextOverdue = null;
  let nextDueRow = null;

  (instalments || []).forEach((inst, index) => {
    totalCents += inst.amountCents;
    if (inst.cancelled) return;

    const status = effectiveStatus(inst, now);
    const heldAmount = inst.reportedCents != null ? inst.reportedCents : inst.amountCents;

    switch (status) {
      case 'cleared':
        clearedCents += inst.amountCents;
        break;
      case 'agent':
      case 'transit':
        heldCents += heldAmount;
        outstandingCents += 0; // held money isn't "outstanding from the student" anymore
        break;
      case 'funder':
        funderCents += inst.amountCents;
        break;
      case 'due':
        outstandingCents += inst.amountCents;
        if (!nextDueRow || new Date(inst.dueDate) < new Date(nextDueRow.dueDate)) {
          nextDueRow = { instalmentIndex: index, label: inst.label, dueDate: inst.dueDate, amountCents: inst.amountCents };
        }
        break;
      case 'overdue':
        outstandingCents += inst.amountCents;
        overdueCents += inst.amountCents;
        if (!nextOverdue || new Date(inst.dueDate) < new Date(nextOverdue.dueDate)) {
          nextOverdue = { instalmentIndex: index, label: inst.label, dueDate: inst.dueDate, amountCents: inst.amountCents };
        }
        break;
      default:
        break;
    }
  });

  const nextDue = nextOverdue || nextDueRow || 'Cleared';

  return { totalCents, clearedCents, heldCents, funderCents, outstandingCents, overdueCents, nextDue };
}

module.exports = sums;
