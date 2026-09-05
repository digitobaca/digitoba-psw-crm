const sums = require('../services/sums');

const now = new Date('2026-09-01T00:00:00.000Z');

function inst(overrides) {
  return {
    label: 'row',
    amountCents: 100000,
    reportedCents: null,
    dueDate: '2026-10-01',
    channel: 'agent',
    status: 'due',
    collectedOn: null,
    batchRef: null,
    receiptRef: null,
    cancelled: false,
    ...overrides,
  };
}

describe('sums', () => {
  it('buckets cleared / held / funder / outstanding / overdue correctly', () => {
    const instalments = [
      inst({ label: 'a', amountCents: 100000, status: 'cleared' }),
      inst({ label: 'b', amountCents: 200000, status: 'agent', batchRef: null, reportedCents: 200000 }), // held
      inst({ label: 'c', amountCents: 150000, status: 'agent', batchRef: 'MC-1', reportedCents: 150000 }), // transit -> held
      inst({ label: 'd', amountCents: 50000, status: 'funder' }),
      inst({ label: 'e', amountCents: 30000, status: 'due', dueDate: '2026-08-01' }), // overdue
      inst({ label: 'f', amountCents: 40000, status: 'due', dueDate: '2026-12-01' }), // due
    ];

    const result = sums(instalments, now);
    expect(result.totalCents).toBe(100000 + 200000 + 150000 + 50000 + 30000 + 40000);
    expect(result.clearedCents).toBe(100000);
    expect(result.heldCents).toBe(200000 + 150000);
    expect(result.funderCents).toBe(50000);
    expect(result.overdueCents).toBe(30000);
    expect(result.outstandingCents).toBe(30000 + 40000);
    expect(result.nextDue).toMatchObject({ label: 'e' }); // overdue wins over due
  });

  it('excludes cancelled instalments from every bucket except total', () => {
    const instalments = [inst({ amountCents: 100000, status: 'due', dueDate: '2026-08-01', cancelled: true })];
    const result = sums(instalments, now);
    expect(result.totalCents).toBe(100000);
    expect(result.outstandingCents).toBe(0);
    expect(result.overdueCents).toBe(0);
    expect(result.nextDue).toBe('Cleared');
  });

  it('reports "Cleared" as nextDue when nothing is due or overdue', () => {
    const instalments = [inst({ amountCents: 100000, status: 'cleared' })];
    const result = sums(instalments, now);
    expect(result.nextDue).toBe('Cleared');
  });
});
