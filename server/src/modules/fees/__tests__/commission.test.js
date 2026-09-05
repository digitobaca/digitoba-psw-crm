const commission = require('../services/commission');

const now = new Date('2026-09-01T00:00:00.000Z');
const partner = { _id: 'p1', commissionRatePct: 15, remitWindowDays: 7 };

function inst(overrides) {
  return { amountCents: 100000, reportedCents: null, status: 'due', batchRef: null, collectedOn: null, cancelled: false, ...overrides };
}

describe('commission', () => {
  it('accrues only on cleared instalments of intl students', () => {
    const students = [
      { fundingType: 'intl', instalments: [inst({ amountCents: 100000, status: 'cleared' })] },
      { fundingType: 'intl', instalments: [inst({ amountCents: 200000, status: 'due' })] }, // not cleared yet
    ];
    const result = commission(partner, students, [], now);
    expect(result.confirmedVolumeCents).toBe(100000);
    expect(result.accruedCents).toBe(Math.round(100000 * 0.15));
  });

  it('never accrues commission on self or bjo students', () => {
    const students = [
      { fundingType: 'self', instalments: [inst({ amountCents: 500000, status: 'cleared' })] },
      { fundingType: 'bjo', instalments: [inst({ amountCents: 500000, status: 'cleared' })] },
    ];
    const result = commission(partner, students, [], now);
    expect(result.confirmedVolumeCents).toBe(0);
    expect(result.accruedCents).toBe(0);
  });

  it('subtracts refund clawback for netPayable, scoped to this partner only', () => {
    const students = [{ fundingType: 'intl', instalments: [inst({ amountCents: 100000, status: 'cleared' })] }];
    const refunds = [
      { partnerId: 'p1', clawbackCents: 5000 },
      { partnerId: 'other-partner', clawbackCents: 99999 },
    ];
    const result = commission(partner, students, refunds, now);
    expect(result.clawbackCents).toBe(5000);
    expect(result.netPayableCents).toBe(result.accruedCents - 5000);
  });

  it('computes held amount, oldest held days, and lateness against remitWindowDays', () => {
    const students = [
      {
        fundingType: 'intl',
        instalments: [
          inst({ amountCents: 100000, reportedCents: 100000, status: 'agent', batchRef: null, collectedOn: '2026-08-15' }), // 17 days held
        ],
      },
    ];
    const result = commission(partner, students, [], now);
    expect(result.heldCents).toBe(100000);
    expect(result.oldestHeldDays).toBe(17);
    expect(result.late).toBe(true); // 17 > remitWindowDays (7)
  });

  it('counts a transit (batched, unconfirmed) instalment as held too', () => {
    const students = [
      { fundingType: 'intl', instalments: [inst({ amountCents: 50000, reportedCents: 50000, status: 'agent', batchRef: 'MC-1', collectedOn: '2026-08-30' })] },
    ];
    const result = commission(partner, students, [], now);
    expect(result.heldCents).toBe(50000);
    expect(result.late).toBe(false); // 2 days held < 7 day window
  });
});
