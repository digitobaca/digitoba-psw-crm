const refundCalc = require('../services/refundCalc');

// Mirrors pswde: $9,545 total, $350 books line, 700 hours total.
const base = {
  programFeesCents: 954500,
  hoursTotal: 700,
  booksCostCents: 35000,
  commissionRatePct: 18,
  noticeDate: new Date('2026-09-01T00:00:00.000Z'),
};

describe('refundCalc — service fee', () => {
  it('caps the service fee at $500 even when 20% of program fees is higher', () => {
    const result = refundCalc({ ...base, paidCents: 954500, hoursDelivered: 0, reason: 'before', booksReturned: true });
    expect(result.serviceFeeCents).toBe(50000); // min($1,909, $500)
  });

  it('does not cap below 20% for a cheaper program', () => {
    const result = refundCalc({ ...base, programFeesCents: 100000, paidCents: 100000, hoursDelivered: 0, reason: 'before', booksReturned: true });
    expect(result.serviceFeeCents).toBe(20000); // 20% of $1,000
  });
});

describe('refundCalc — rescind (s.25, full refund)', () => {
  it('refunds everything paid, no service fee retained, books cost applies unless returned', () => {
    const result = refundCalc({ ...base, paidCents: 300000, hoursDelivered: 0, reason: 'rescind', booksReturned: false });
    expect(result.retainServiceCents).toBe(0);
    expect(result.earnedCents).toBe(0);
    expect(result.booksCents).toBe(35000);
    expect(result.refundCents).toBe(300000 - 35000);
    expect(result.clawbackCents).toBe(Math.round(result.refundCents * 0.18));
  });

  it('drops the books deduction when books were returned', () => {
    const result = refundCalc({ ...base, paidCents: 300000, hoursDelivered: 0, reason: 'rescind', booksReturned: true });
    expect(result.booksCents).toBe(0);
    expect(result.refundCents).toBe(300000);
  });
});

describe('refundCalc — before (s.26, all fees except service fee)', () => {
  it('retains the service fee and unreturned books, refunds the rest', () => {
    const result = refundCalc({ ...base, paidCents: 200000, hoursDelivered: 0, reason: 'before', booksReturned: false });
    expect(result.retainServiceCents).toBe(50000);
    expect(result.earnedCents).toBe(0);
    expect(result.booksCents).toBe(35000);
    expect(result.refundCents).toBe(200000 - 50000 - 35000);
  });

  it('never goes negative when paid is less than what the college retains', () => {
    const result = refundCalc({ ...base, paidCents: 50000, hoursDelivered: 0, reason: 'before', booksReturned: false });
    expect(result.refundCents).toBe(0);
  });
});

describe('refundCalc — visa (s.26/s.32, treated as a withdrawal)', () => {
  it('applies the same formula as "before"', () => {
    const before = refundCalc({ ...base, paidCents: 200000, hoursDelivered: 0, reason: 'before', booksReturned: false });
    const visa = refundCalc({ ...base, paidCents: 200000, hoursDelivered: 0, reason: 'visa', booksReturned: false });
    expect(visa.refundCents).toBe(before.refundCents);
  });
});

describe('refundCalc — after (s.27, partial refund only before the midpoint)', () => {
  it('deducts earned fees proportional to hours delivered when before the midpoint', () => {
    const result = refundCalc({ ...base, paidCents: 954500, hoursDelivered: 140, reason: 'after', booksReturned: true }); // 20% of hours
    expect(result.frac).toBeCloseTo(0.2);
    expect(result.pastMidpoint).toBe(false);
    expect(result.earnedCents).toBe(Math.round(954500 * 0.2));
    expect(result.refundCents).toBe(954500 - 50000 - result.earnedCents - 0);
  });

  it('refunds exactly $0 once hours delivered reach the midpoint', () => {
    const result = refundCalc({ ...base, paidCents: 954500, hoursDelivered: 350, reason: 'after', booksReturned: true }); // 50%
    expect(result.pastMidpoint).toBe(true);
    expect(result.refundCents).toBe(0);
    expect(result.clawbackCents).toBe(0);
  });

  it('refunds $0 well past the midpoint too', () => {
    const result = refundCalc({ ...base, paidCents: 954500, hoursDelivered: 690, reason: 'after', booksReturned: true }); // ~98.6%
    expect(result.pastMidpoint).toBe(true);
    expect(result.refundCents).toBe(0);
  });

  it('clamps hoursDelivered to hoursTotal (never exceeds 100% earned)', () => {
    const result = refundCalc({ ...base, paidCents: 954500, hoursDelivered: 5000, reason: 'after', booksReturned: true });
    expect(result.frac).toBe(1);
  });
});

describe('refundCalc — dueBy and clawback', () => {
  it('sets dueBy to noticeDate + 30 days', () => {
    const result = refundCalc({ ...base, paidCents: 100000, hoursDelivered: 0, reason: 'rescind', booksReturned: true });
    expect(result.dueBy.toISOString().slice(0, 10)).toBe('2026-10-01');
  });

  it('computes clawback as refund * commissionRatePct / 100', () => {
    const result = refundCalc({ ...base, paidCents: 300000, hoursDelivered: 0, reason: 'rescind', booksReturned: true, commissionRatePct: 12 });
    expect(result.clawbackCents).toBe(Math.round(300000 * 0.12));
  });
});
