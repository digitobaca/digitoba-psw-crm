const { buildPlan } = require('../services/buildPlan');

// Mirrors the seeded pswde program (BUILD PROMPT appendix): total $9,545 (<=$10k).
const pswde = {
  code: 'pswde',
  totalCents: 954500,
  intlSurchargeCents: 0,
  clearBeforeDays: 60,
  instalmentTemplate: [
    { label: 'Initial deposit', amountCents: 50000 },
    { label: 'Before program start', amountCents: 100000 },
    { label: 'Instalment 1', amountCents: 200000 },
    { label: 'Instalment 2', amountCents: 200000 },
  ],
};

// Mirrors the seeded catp program: total $9,685 + $3,500 surcharge = $13,185 (> $10k).
const catp = {
  code: 'catp',
  totalCents: 968500,
  intlSurchargeCents: 350000,
  clearBeforeDays: null,
  instalmentTemplate: [
    { label: 'Initial deposit', amountCents: 50000 },
    { label: 'Before program start', amountCents: 100000 },
    { label: 'Instalment 1', amountCents: 150000 },
    { label: 'Instalment 2', amountCents: 150000 },
    { label: 'Instalment 3', amountCents: 150000 },
  ],
};

const cohortStart = new Date('2026-09-01T00:00:00.000Z');

describe('buildPlan — self funding', () => {
  it('uses the instalment template verbatim, channel direct, all status due', () => {
    const rows = buildPlan(pswde, 'self', cohortStart);
    expect(rows).toHaveLength(4);
    expect(rows.map((r) => r.amountCents)).toEqual([50000, 100000, 200000, 200000]);
    rows.forEach((r) => {
      expect(r.channel).toBe('direct');
      expect(r.status).toBe('due');
      expect(r.cancelled).toBe(false);
    });
  });

  it('row 0 is start-60, row 1 is start-7, tail spread to end at clearBeforeDays', () => {
    const rows = buildPlan(pswde, 'self', cohortStart);
    expect(rows[0].dueDate.toISOString().slice(0, 10)).toBe('2026-07-03'); // -60d
    expect(rows[1].dueDate.toISOString().slice(0, 10)).toBe('2026-08-25'); // -7d
    // 2 tail rows spread evenly to end exactly at start+60d
    const last = rows[rows.length - 1].dueDate;
    expect(last.toISOString().slice(0, 10)).toBe('2026-10-31'); // +60d
    expect(rows[2].dueDate.getTime()).toBeLessThan(rows[3].dueDate.getTime());
  });

  it('spreads tail rows every 30 days after start when clearBeforeDays is null', () => {
    const program = { ...pswde, clearBeforeDays: null };
    const rows = buildPlan(program, 'self', cohortStart);
    expect(rows[2].dueDate.toISOString().slice(0, 10)).toBe('2026-10-01'); // +30d
    expect(rows[3].dueDate.toISOString().slice(0, 10)).toBe('2026-10-31'); // +60d
  });
});

describe('buildPlan — bjo', () => {
  it('splits into 37% / 37% / remainder, channel funder, due at -30/+30/+90', () => {
    const rows = buildPlan(pswde, 'bjo', cohortStart);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.label)).toEqual(['BJO claim 1', 'BJO claim 2', 'BJO claim 3']);
    rows.forEach((r) => expect(r.channel).toBe('funder'));
    const sum = rows.reduce((acc, r) => acc + r.amountCents, 0);
    expect(sum).toBe(pswde.totalCents); // rounding absorbed by claim 3
    expect(rows[0].amountCents).toBe(Math.round(pswde.totalCents * 0.37));
    expect(rows[1].amountCents).toBe(Math.round(pswde.totalCents * 0.37));
  });
});

describe('buildPlan — intl', () => {
  it('yields 4 instalments (2 fixed + 2) for a program <= $10,000 total', () => {
    const rows = buildPlan(pswde, 'intl', cohortStart);
    expect(rows).toHaveLength(4);
    rows.forEach((r) => expect(r.channel).toBe('agent'));
  });

  it('yields 5 instalments (2 fixed + 3) for a program > $10,000 total', () => {
    const rows = buildPlan(catp, 'intl', cohortStart);
    expect(rows).toHaveLength(5);
  });

  it('every row is a $5 multiple and the plan sums exactly to total + surcharge', () => {
    for (const program of [pswde, catp]) {
      const rows = buildPlan(program, 'intl', cohortStart);
      const expectedTotal = program.totalCents + program.intlSurchargeCents;
      const sum = rows.reduce((acc, r) => acc + r.amountCents, 0);
      expect(sum).toBe(expectedTotal);
      rows.forEach((r) => expect(r.amountCents % 500).toBe(0));
    }
  });

  it('fixed deposit/before-start rows are $500 / $1,000 at start-75 / start-7', () => {
    const rows = buildPlan(pswde, 'intl', cohortStart);
    expect(rows[0]).toMatchObject({ label: 'Initial deposit', amountCents: 50000 });
    expect(rows[1]).toMatchObject({ label: 'Before program start', amountCents: 100000 });
    expect(rows[0].dueDate.toISOString().slice(0, 10)).toBe('2026-06-18'); // -75d
    expect(rows[1].dueDate.toISOString().slice(0, 10)).toBe('2026-08-25'); // -7d
  });
});
