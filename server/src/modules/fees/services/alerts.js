const effectiveStatus = require('./effectiveStatus');
const { MISMATCH_THRESHOLD_CENTS } = require('./transitions');

/**
 * Computed-on-read action queue (BUILD PROMPT section 4.6, `GET /api/fees/alerts`).
 * `students` must already be scoped to the caller's role — this function
 * does not re-check ownership, it only orders/labels what it's given.
 *
 * Order: (1) amount mismatches, (2) overdue instalments, (3) held-not-remitted
 * (registrar) / "remit within N days" (partner), (4) BJO claims awaiting deposit.
 *
 * @param {object[]} students - scoped FeeStudent docs/plain objects (partner map optional via partnersById)
 * @param {object} opts
 * @param {'admin'|'registrar'|'partner'|'counsellor'} opts.role
 * @param {Map<string, object>} [opts.partnersById] - for remit-window lookups
 * @param {Date} [opts.now]
 */
function computeAlerts(students, { role, partnersById = new Map(), now = new Date() } = {}) {
  const mismatches = [];
  const overdue = [];
  const held = [];
  const bjoClaims = [];

  students.forEach((student) => {
    (student.instalments || []).forEach((inst, idx) => {
      if (inst.cancelled) return;
      const status = effectiveStatus(inst, now);

      if (inst.status === 'agent' && !inst.batchRef && inst.reportedCents != null) {
        const diff = Math.abs(inst.reportedCents - inst.amountCents);
        if (diff > MISMATCH_THRESHOLD_CENTS) {
          mismatches.push({
            tone: 'bad',
            title: `${student.name} — reported amount doesn't match invoice`,
            meta: `${inst.label}: reported $${(inst.reportedCents / 100).toFixed(2)} vs invoiced $${(inst.amountCents / 100).toFixed(2)}`,
            actionLabel: 'Review',
            deepLink: { kind: 'student', id: student._id },
          });
          return; // a mismatched row is already counted, don't double-list it under "held"
        }
      }

      if (status === 'overdue') {
        overdue.push({
          tone: 'warn',
          title: `${student.name} — ${inst.label} overdue`,
          meta: `$${(inst.amountCents / 100).toFixed(2)} was due ${new Date(inst.dueDate).toLocaleDateString('en-CA')}`,
          actionLabel: 'Follow up',
          deepLink: { kind: 'student', id: student._id },
        });
      }

      if (status === 'agent') {
        const partner = partnersById.get(String(student.partnerId));
        const windowDays = partner?.remitWindowDays ?? 7;
        held.push({
          tone: 'info',
          title:
            role === 'partner'
              ? `${student.name} — remit to college within ${windowDays} days`
              : `${student.name} — held by agent, not yet remitted`,
          meta: `${inst.label}: $${((inst.reportedCents ?? inst.amountCents) / 100).toFixed(2)}${partner ? ` · ${partner.name}` : ''}`,
          actionLabel: role === 'partner' ? 'Send remittance' : 'Awaiting partner',
          deepLink: { kind: 'student', id: student._id },
        });
      }

      if (status === 'funder' && student.fundingType === 'bjo') {
        bjoClaims.push({
          tone: 'info',
          title: `${student.name} — ${inst.label} awaiting ministry deposit`,
          meta: `$${(inst.amountCents / 100).toFixed(2)} submitted to BJO`,
          actionLabel: 'Confirm receipt',
          deepLink: { kind: 'student', id: student._id },
        });
      }
    });
  });

  return [...mismatches, ...overdue, ...held, ...bjoClaims];
}

module.exports = computeAlerts;
