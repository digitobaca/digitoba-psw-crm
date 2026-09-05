const { addDays } = require('../utils/dates');
const HttpError = require('../utils/HttpError');

const NICKEL = 500; // $5 in cents — intl instalments round to a multiple of this

/** Rounds `cents` to the nearest multiple of `step` cents. */
function roundToStep(cents, step) {
  return Math.round(cents / step) * step;
}

/**
 * Spreads `count` due dates ending exactly at `clearBeforeDays` days after
 * `start` when that rule is set, or every 30 days after `start` otherwise.
 * Shared by the "self" plan's tail rows and the "intl" plan's instalments —
 * see BUILD PROMPT section 4.1.
 */
function spreadDueDates(start, count, clearBeforeDays) {
  const dates = [];
  for (let i = 1; i <= count; i += 1) {
    if (clearBeforeDays != null) {
      dates.push(addDays(start, (clearBeforeDays * i) / count));
    } else {
      dates.push(addDays(start, 30 * i));
    }
  }
  return dates;
}

function baseRow(overrides) {
  return {
    reportedCents: null,
    collectedOn: null,
    batchRef: null,
    receiptRef: null,
    cancelled: false,
    status: 'due',
    ...overrides,
  };
}

/** self-funding plan: program.instalmentTemplate as-is, channel `direct`. */
function buildSelfPlan(program, cohortStart) {
  const template = program.instalmentTemplate || [];
  if (template.length === 0) {
    throw new HttpError(400, `Program ${program.code} has no instalmentTemplate for self-funding students`);
  }

  const rows = [];
  template.forEach((row, index) => {
    let dueDate;
    if (index === 0) dueDate = addDays(cohortStart, -60);
    else if (index === 1) dueDate = addDays(cohortStart, -7);
    else dueDate = null; // filled in below, spread over the remaining rows
    rows.push({ label: row.label, amountCents: row.amountCents, dueDate, channel: 'direct' });
  });

  const tailCount = rows.length - 2;
  if (tailCount > 0) {
    const tailDates = spreadDueDates(cohortStart, tailCount, program.clearBeforeDays);
    for (let i = 0; i < tailCount; i += 1) {
      rows[2 + i].dueDate = tailDates[i];
    }
  }

  return rows.map((r) => baseRow(r));
}

/** bjo plan: three ministry claims of 37% / 37% / remainder, channel `funder`. */
function buildBjoPlan(program, cohortStart) {
  const total = program.totalCents;
  const first = Math.round(total * 0.37);
  const second = Math.round(total * 0.37);
  const third = total - first - second;

  return [
    baseRow({ label: 'BJO claim 1', amountCents: first, dueDate: addDays(cohortStart, -30), channel: 'funder' }),
    baseRow({ label: 'BJO claim 2', amountCents: second, dueDate: addDays(cohortStart, 30), channel: 'funder' }),
    baseRow({ label: 'BJO claim 3', amountCents: third, dueDate: addDays(cohortStart, 90), channel: 'funder' }),
  ];
}

/**
 * intl plan: fixed $500 deposit + $1,000 before-start row, then N further
 * instalments (N=3 if total > $10,000, else 2) splitting the remainder in
 * $5-multiples, the last one absorbing the rounding so the plan sums exactly
 * to total + surcharge. Channel `agent`.
 */
function buildIntlPlan(program, cohortStart) {
  const total = program.totalCents + (program.intlSurchargeCents || 0);
  const deposit = 50000; // $500
  const beforeStart = 100000; // $1,000
  const remainder = total - deposit - beforeStart;
  if (remainder < 0) {
    throw new HttpError(400, `Program ${program.code} total is too small for the intl deposit + before-start rows`);
  }

  const count = total > 1000000 ? 3 : 2; // > $10,000

  const amounts = [];
  let allocated = 0;
  for (let i = 0; i < count - 1; i += 1) {
    const share = roundToStep(remainder / count, NICKEL);
    amounts.push(share);
    allocated += share;
  }
  amounts.push(remainder - allocated); // last row absorbs the rounding

  const dueDates = spreadDueDates(cohortStart, count, program.clearBeforeDays);

  const rows = [
    baseRow({ label: 'Initial deposit', amountCents: deposit, dueDate: addDays(cohortStart, -75), channel: 'agent' }),
    baseRow({ label: 'Before program start', amountCents: beforeStart, dueDate: addDays(cohortStart, -7), channel: 'agent' }),
  ];
  amounts.forEach((amountCents, i) => {
    rows.push(
      baseRow({
        label: count === amounts.length ? `Instalment ${i + 1}` : `Instalment ${i + 1}`,
        amountCents,
        dueDate: dueDates[i],
        channel: 'agent',
      })
    );
  });

  return rows;
}

/**
 * Builds the concrete instalment list for one student from
 * program + fundingType + cohortStart. Pure function — no DB access, no
 * mutation of `program`. See BUILD PROMPT section 4.1.
 */
function buildPlan(program, fundingType, cohortStart) {
  if (!program) throw new HttpError(400, 'A program is required to build a fee plan');
  const start = new Date(cohortStart);
  if (Number.isNaN(start.getTime())) throw new HttpError(400, 'A valid cohort start date is required');

  switch (fundingType) {
    case 'self':
      return buildSelfPlan(program, start);
    case 'bjo':
      return buildBjoPlan(program, start);
    case 'intl':
      return buildIntlPlan(program, start);
    default:
      throw new HttpError(400, `Unknown funding type: ${fundingType}`);
  }
}

module.exports = { buildPlan, buildSelfPlan, buildBjoPlan, buildIntlPlan, roundToStep, spreadDueDates };
