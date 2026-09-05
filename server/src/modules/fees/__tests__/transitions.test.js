const {
  logReceipt,
  confirmReceipt,
  recordDirect,
  submitClaim,
  createBatch,
  confirmBatch,
  approveRefund,
  createStudent,
} = require('../services/transitions');

const now = new Date('2026-09-01T00:00:00.000Z');

function inst(overrides) {
  return {
    label: 'Instalment 1',
    amountCents: 100000,
    reportedCents: null,
    dueDate: new Date('2026-10-01'),
    channel: 'agent',
    status: 'due',
    collectedOn: null,
    batchRef: null,
    receiptRef: null,
    cancelled: false,
    ...overrides,
  };
}

function student(overrides) {
  return {
    _id: 's1',
    name: 'Test Student',
    partnerId: 'partner-1',
    fundingType: 'intl',
    withdrawal: null,
    instalments: [inst()],
    ...overrides,
  };
}

describe('logReceipt', () => {
  it('sets status to agent and records the reported amount', () => {
    const s = student();
    const event = logReceipt(s, 0, { amountCents: 100000, date: now }, { role: 'partner', partnerId: 'partner-1', now });
    expect(s.instalments[0].status).toBe('agent');
    expect(s.instalments[0].reportedCents).toBe(100000);
    expect(event.tag).toBe('AGENT WRITE');
  });

  it('flags a MISMATCH event when reported differs from invoiced by more than 50 cents', () => {
    const s = student();
    const event = logReceipt(s, 0, { amountCents: 356000, date: now }, { role: 'partner', partnerId: 'partner-1', now });
    expect(event.tag).toBe('MISMATCH');
    expect(event.tone).toBe('bad');
  });

  it('403s a partner acting on another partner\'s student', () => {
    const s = student({ partnerId: 'someone-else' });
    expect(() => logReceipt(s, 0, { amountCents: 100000, date: now }, { role: 'partner', partnerId: 'partner-1', now })).toThrow(/own students/i);
  });

  it('409s when the instalment is not due/overdue', () => {
    const s = student({ instalments: [inst({ status: 'cleared' })] });
    expect(() => logReceipt(s, 0, { amountCents: 100000, date: now }, { role: 'registrar', now })).toThrow(/not open/i);
  });

  it('409s a direct-channel instalment (only agent channel accepts a receipt)', () => {
    const s = student({ instalments: [inst({ channel: 'direct' })] });
    expect(() => logReceipt(s, 0, { amountCents: 100000, date: now }, { role: 'registrar', now })).toThrow(/agent-channel/i);
  });

  it('403s a role with no business logging a receipt', () => {
    const s = student();
    expect(() => logReceipt(s, 0, { amountCents: 100000, date: now }, { role: 'counsellor', now })).toThrow(/permission/i);
  });
});

describe('confirmReceipt', () => {
  it('clears the instalment, adopting the reported amount and a receipt ref', () => {
    const s = student({ instalments: [inst({ status: 'agent', reportedCents: 99000, batchRef: null })] });
    const event = confirmReceipt(s, 0, { rcptRef: 'RCPT-1', mtcuRef: 'MTCU-2026-1' }, { role: 'registrar', now });
    expect(s.instalments[0].status).toBe('cleared');
    expect(s.instalments[0].amountCents).toBe(99000);
    expect(s.instalments[0].receiptRef).toBe('RCPT-1 · confirmed by registrar');
    expect(event.tag).toBe('CONFIRMED');
  });

  it('uses an MTCU ref for a funder-channel (BJO) claim', () => {
    const s = student({ instalments: [inst({ status: 'funder', channel: 'funder' })] });
    confirmReceipt(s, 0, { rcptRef: 'RCPT-1', mtcuRef: 'MTCU-2026-1' }, { role: 'registrar', now });
    expect(s.instalments[0].receiptRef).toBe('MTCU-2026-1 · ministry deposit');
  });

  it('409s (idempotent no-op) confirming an already-confirmed instalment', () => {
    const s = student({ instalments: [inst({ status: 'cleared' })] });
    expect(() => confirmReceipt(s, 0, { rcptRef: 'RCPT-1' }, { role: 'registrar', now })).toThrow(/already confirmed/i);
  });

  it('409s an agent instalment that is inside an unconfirmed batch (must confirm the batch instead)', () => {
    const s = student({ instalments: [inst({ status: 'agent', batchRef: 'MC-2026-01' })] });
    expect(() => confirmReceipt(s, 0, { rcptRef: 'RCPT-1' }, { role: 'registrar', now })).toThrow(/not ready/i);
  });

  it('403s a partner (only registrar/admin can confirm)', () => {
    const s = student({ instalments: [inst({ status: 'agent' })] });
    expect(() => confirmReceipt(s, 0, { rcptRef: 'RCPT-1' }, { role: 'partner', partnerId: 'partner-1', now })).toThrow(/permission/i);
  });

  it('admin is allowed everywhere registrar is', () => {
    const s = student({ instalments: [inst({ status: 'agent' })] });
    expect(() => confirmReceipt(s, 0, { rcptRef: 'RCPT-1' }, { role: 'admin', now })).not.toThrow();
  });
});

describe('recordDirect', () => {
  it('sets channel direct, clears the instalment, and stamps the receipt ref', () => {
    const s = student({ instalments: [inst({ status: 'due' })] });
    const event = recordDirect(s, 0, { amountCents: 100000, date: now, rcptRef: 'RCPT-2' }, { role: 'registrar', now });
    expect(s.instalments[0].channel).toBe('direct');
    expect(s.instalments[0].status).toBe('cleared');
    expect(s.instalments[0].receiptRef).toBe('RCPT-2 · paid direct');
    expect(event.tag).toBe('DIRECT');
  });

  it('409s when the instalment is already cleared', () => {
    const s = student({ instalments: [inst({ status: 'cleared' })] });
    expect(() => recordDirect(s, 0, { amountCents: 100000, date: now, rcptRef: 'RCPT-2' }, { role: 'registrar', now })).toThrow(/not open/i);
  });
});

describe('submitClaim', () => {
  it('moves a bjo instalment to funder status', () => {
    const s = student({ fundingType: 'bjo', instalments: [inst({ status: 'due', channel: 'funder' })] });
    const event = submitClaim(s, 0, { role: 'registrar', now });
    expect(s.instalments[0].status).toBe('funder');
    expect(event.tag).toBe('BJO');
  });

  it('409s a non-bjo student', () => {
    const s = student({ fundingType: 'intl' });
    expect(() => submitClaim(s, 0, { role: 'registrar', now })).toThrow(/better jobs ontario/i);
  });
});

describe('createBatch / confirmBatch', () => {
  it('marks every item batched (effective transit) and sums the amount', () => {
    const s1 = student({ _id: 's1', instalments: [inst({ status: 'agent', reportedCents: 100000 })] });
    const s2 = student({ _id: 's2', instalments: [inst({ status: 'agent', reportedCents: 50000 })] });
    const { batchItems, amountCents, event } = createBatch(
      [
        { student: s1, instalmentIndex: 0 },
        { student: s2, instalmentIndex: 0 },
      ],
      { partnerId: 'partner-1', batchRef: 'MC-2026-07' },
      { role: 'partner', partnerId: 'partner-1', now }
    );
    expect(amountCents).toBe(150000);
    expect(batchItems).toHaveLength(2);
    expect(s1.instalments[0].batchRef).toBe('MC-2026-07');
    expect(event.tag).toBe('REMIT');
  });

  it('409s when an item is not held-and-unbatched', () => {
    const s1 = student({ instalments: [inst({ status: 'due' })] });
    expect(() =>
      createBatch([{ student: s1, instalmentIndex: 0 }], { partnerId: 'partner-1', batchRef: 'MC-1' }, { role: 'registrar', now })
    ).toThrow(/not held-and-unbatched/i);
  });

  it('confirmBatch clears every item and reconciles the batch; 409s if reconciled again', () => {
    const s1 = student({ instalments: [inst({ status: 'agent', reportedCents: 100000, batchRef: 'MC-1' })] });
    const batch = { ref: 'MC-1', wireRef: 'WIRE-1', status: 'pending', amountCents: 100000, items: [{ studentId: 's1', instalmentIndex: 0 }] };
    const event = confirmBatch(batch, [s1], { rcptRef: 'RCPT-9' }, { role: 'registrar', now });
    expect(batch.status).toBe('reconciled');
    expect(s1.instalments[0].status).toBe('cleared');
    expect(s1.instalments[0].receiptRef).toBe('RCPT-9 · batch MC-1 · wire WIRE-1');
    expect(event.tag).toBe('RECONCILED');

    expect(() => confirmBatch(batch, [s1], { rcptRef: 'RCPT-10' }, { role: 'registrar', now })).toThrow(/already reconciled/i);
  });
});

describe('approveRefund', () => {
  it('cancels remaining due/overdue instalments and stores the withdrawal', () => {
    const s = student({
      instalments: [
        inst({ status: 'cleared' }),
        inst({ status: 'due', dueDate: new Date('2026-08-01') }), // overdue relative to `now`
        inst({ status: 'due', dueDate: new Date('2026-12-01') }), // due
      ],
    });
    const refundResult = { noticeDate: now, reason: 'before', refundCents: 40000, clawbackCents: 7200 };
    const event = approveRefund(s, refundResult, { role: 'registrar', now });
    expect(s.instalments[0].cancelled).toBe(false); // already cleared — untouched
    expect(s.instalments[1].cancelled).toBe(true);
    expect(s.instalments[2].cancelled).toBe(true);
    expect(s.withdrawal).toMatchObject({ reason: 'before', refundCents: 40000, clawbackCents: 7200 });
    expect(event.tag).toBe('REFUND');
  });

  it('409s a student who has already withdrawn', () => {
    const s = student({ withdrawal: { date: now, reason: 'before', refundCents: 0, clawbackCents: 0 } });
    expect(() => approveRefund(s, { noticeDate: now, reason: 'before', refundCents: 0, clawbackCents: 0 }, { role: 'registrar', now })).toThrow(
      /already withdrawn/i
    );
  });
});

describe('createStudent', () => {
  const program = { name: 'PSW', active: true };

  it('requires a partner for intl funding', () => {
    expect(() => createStudent({ program, fundingType: 'intl', partnerId: null }, { role: 'registrar' })).toThrow(/recruiting partner/i);
  });

  it('rejects a partner on a non-intl student', () => {
    expect(() => createStudent({ program, fundingType: 'self', partnerId: 'p1' }, { role: 'registrar' })).toThrow(/only intl students/i);
  });

  it('rejects an inactive/missing program', () => {
    expect(() => createStudent({ program: { ...program, active: false }, fundingType: 'self', partnerId: null }, { role: 'registrar' })).toThrow(
      /active program/i
    );
  });

  it('succeeds for a valid self-funding student', () => {
    const event = createStudent({ program, fundingType: 'self', partnerId: null }, { role: 'registrar' });
    expect(event.tag).toBe('NEW');
  });

  it('403s a partner trying to create a student', () => {
    expect(() => createStudent({ program, fundingType: 'self', partnerId: null }, { role: 'partner', partnerId: 'p1' })).toThrow(/permission/i);
  });
});
