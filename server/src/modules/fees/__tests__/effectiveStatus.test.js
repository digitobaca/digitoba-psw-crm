const effectiveStatus = require('../services/effectiveStatus');

const now = new Date('2026-09-01T00:00:00.000Z');

describe('effectiveStatus', () => {
  it('returns transit when status is agent and batchRef is set', () => {
    const inst = { status: 'agent', batchRef: 'MC-2026-07', dueDate: '2026-10-01', cancelled: false };
    expect(effectiveStatus(inst, now)).toBe('transit');
  });

  it('returns overdue when status is due, past due date, and not cancelled', () => {
    const inst = { status: 'due', batchRef: null, dueDate: '2026-08-01', cancelled: false };
    expect(effectiveStatus(inst, now)).toBe('overdue');
  });

  it('does not mark a cancelled due instalment as overdue', () => {
    const inst = { status: 'due', batchRef: null, dueDate: '2026-08-01', cancelled: true };
    expect(effectiveStatus(inst, now)).toBe('due');
  });

  it('returns due when not yet past the due date', () => {
    const inst = { status: 'due', batchRef: null, dueDate: '2026-10-01', cancelled: false };
    expect(effectiveStatus(inst, now)).toBe('due');
  });

  it('passes through cleared / funder / agent (no batch) unchanged', () => {
    expect(effectiveStatus({ status: 'cleared', dueDate: '2026-01-01', cancelled: false }, now)).toBe('cleared');
    expect(effectiveStatus({ status: 'funder', dueDate: '2026-01-01', cancelled: false }, now)).toBe('funder');
    expect(effectiveStatus({ status: 'agent', batchRef: null, dueDate: '2026-01-01', cancelled: false }, now)).toBe('agent');
  });
});
