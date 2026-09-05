/**
 * One-off CLI script that seeds the Fee Ledger module with the four college
 * programs, the seven recruitment partners, twelve demo students (a mix of
 * funding types and instalment states — including one deliberate amount
 * mismatch), and a handful of feed events, so the module can be exercised
 * end-to-end without hand-entering data.
 *
 * Also creates one `registrar` staff login and one `partner` login per
 * partner — DEV ONLY. Gated behind SEED_FEES_CREATE_USERS (defaults to
 * "true" for convenience in a dev/staging DB; set it to "false" to skip
 * user creation, e.g. if you only want the catalog data). Every created
 * account uses the same placeholder password (logged at the end) — rotate
 * it before this ever touches a real environment.
 *
 * Usage:
 *   node src/modules/fees/seed/seedFees.js
 *   npm run seed:fees
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../../../../models/User');
const { FeeProgram, FeePartner, FeeStudent, FeeLedgerEvent } = require('../models');
const { buildPlan } = require('../services/buildPlan');

const DEV_PASSWORD = process.env.SEED_FEES_PASSWORD || 'ChangeMe123!';
const CREATE_USERS = (process.env.SEED_FEES_CREATE_USERS ?? 'true').toLowerCase() !== 'false';

const PROGRAMS = [
  {
    code: 'pswde',
    name: 'NACC Personal Support Worker DE 2022',
    type: 'Certificate',
    durationShort: '25 weeks',
    durationFull: '25 weeks, 700 hours, 28 h/wk',
    hoursTotal: 700,
    feeLines: [
      { label: 'Tuition', amountCents: 800000 },
      { label: 'Books', amountCents: 35000 },
      { label: 'Professional exam fee', amountCents: 20000 },
      { label: 'Co-op fee', amountCents: 20000 },
      { label: 'CPR BLS', amountCents: 30000 },
      { label: 'Admin', amountCents: 49500 },
    ],
    totalCents: 954500,
    selfFundingCents: 550000,
    intlSurchargeCents: 0,
    instalmentTemplate: [
      { label: 'Initial deposit', amountCents: 50000 },
      { label: 'Before program start', amountCents: 100000 },
      { label: 'Instalment 1', amountCents: 200000 },
      { label: 'Instalment 2', amountCents: 200000 },
    ],
    planLabel: 'Self-funding plan',
    planNote: 'All instalments must clear before 60 days of program start.',
    clearBeforeDays: 60,
    admissionRequirements: 'OSSD; SLE-11; VSS; Covid vaccination; Medical report.',
    nocCode: '33102',
    nocFull: 'Nurse aides, orderlies and patient service associates',
    teer: '3',
    expressEntryEligible: true,
    placement: '300 hours (long-term care, retirement homes)',
    jobAssistance: true,
    schedule: 'Mon–Thu 8am–3pm / 3pm–10pm · Thu–Sun 8am–3pm / 3pm–10pm',
    bonus: '',
    bjoNote: '',
  },
  {
    code: 'fsw',
    name: 'Food Service Worker',
    type: 'Diploma',
    durationShort: '16 weeks',
    durationFull: '16 weeks, 400 hours',
    hoursTotal: 400,
    feeLines: [
      { label: 'Tuition', amountCents: 600000 },
      { label: 'Books', amountCents: 14000 },
      { label: 'Admin', amountCents: 49500 },
      { label: 'Co-op fee', amountCents: 20000 },
    ],
    totalCents: 683500,
    selfFundingCents: 234000,
    intlSurchargeCents: 0,
    instalmentTemplate: [
      { label: 'Initial deposit', amountCents: 50000 },
      { label: 'Before program start', amountCents: 100000 },
      { label: 'Instalment 1', amountCents: 50000 },
      { label: 'Instalment 2', amountCents: 34000 },
    ],
    planLabel: 'Self-funding plan',
    planNote: 'All instalments must clear before 45 days of program start.',
    clearBeforeDays: 45,
    admissionRequirements: 'OSSD; SLE-14; VSS; Covid vaccination; Medical report.',
    nocCode: '65201',
    nocFull: 'Food and beverage servers / food service workers',
    teer: '5',
    expressEntryEligible: false,
    placement: '140 hours',
    jobAssistance: true,
    schedule: 'Fri–Sun 3pm–10pm',
    bonus: 'Smart Serve certificate complimentary',
    bjoNote: 'Graduation bonus 25% of tuition, $1,500 (BJO only).',
  },
  {
    code: 'moa',
    name: 'Medical Office Assistant',
    type: 'Diploma',
    durationShort: '37 weeks (BJO) / 24 weeks (fast track)',
    durationFull: '37 weeks (740 h) BJO at 20 h/wk · 24 weeks fast track at 30.83 h/wk',
    hoursTotal: 740,
    feeLines: [
      { label: 'Tuition', amountCents: 944000 },
      { label: 'Books', amountCents: 100000 },
      { label: 'Admin', amountCents: 49500 },
      { label: 'Tech fee', amountCents: 30000 },
    ],
    totalCents: 1123500,
    selfFundingCents: 600000,
    intlSurchargeCents: 350000,
    instalmentTemplate: [
      { label: 'Initial deposit', amountCents: 50000 },
      { label: 'Before program start', amountCents: 100000 },
      { label: 'Monthly instalment 1', amountCents: 150000 },
      { label: 'Monthly instalment 2', amountCents: 150000 },
      { label: 'Monthly instalment 3', amountCents: 150000 },
    ],
    planLabel: 'Self-funding plan',
    planNote: 'Billed monthly — no fixed clear-before rule.',
    clearBeforeDays: null,
    admissionRequirements: 'OSSD; SLE-18.',
    nocCode: '13112',
    nocFull: 'Health information management occupations',
    teer: '3',
    expressEntryEligible: true,
    placement: '',
    jobAssistance: true,
    schedule: 'Mon–Thu 4pm–9pm (BJO) · Mon–Thu 3pm–10:30pm (temporary residents)',
    bonus: '',
    bjoNote: 'Graduation bonus $1,500.',
  },
  {
    code: 'catp',
    name: 'Computerized Accounting, Tax & Payroll',
    type: 'Diploma',
    durationShort: '34 weeks (BJO) / 24 weeks (fast track)',
    durationFull: '34 weeks (740 h) BJO at 21.7 h/wk · 24 weeks fast track at 30.8 h/wk',
    hoursTotal: 740,
    feeLines: [
      { label: 'Tuition', amountCents: 775000 },
      { label: 'Books', amountCents: 114000 },
      { label: 'Admin', amountCents: 49500 },
      { label: 'Tech fee', amountCents: 30000 },
    ],
    totalCents: 968500,
    selfFundingCents: 600000,
    intlSurchargeCents: 350000,
    instalmentTemplate: [
      { label: 'Initial deposit', amountCents: 50000 },
      { label: 'Before program start', amountCents: 100000 },
      { label: 'Monthly instalment 1', amountCents: 150000 },
      { label: 'Monthly instalment 2', amountCents: 150000 },
      { label: 'Monthly instalment 3', amountCents: 150000 },
    ],
    planLabel: 'Self-funding plan',
    planNote: 'Billed monthly — no fixed clear-before rule.',
    clearBeforeDays: null,
    admissionRequirements: 'OSSD; SLE-15.',
    nocCode: '12200 / 13102 / 14200',
    nocFull: 'Accounting technicians, bookkeepers, and payroll administrators',
    teer: '2–4',
    expressEntryEligible: false,
    placement: '',
    jobAssistance: true,
    schedule: 'Mon–Fri 4pm–10pm',
    bonus: 'Free laptop with 6-month accounting software and MS Office',
    bjoNote: 'Graduation bonus $1,000.',
  },
];

const PARTNERS = [
  { name: 'Maple Crest Overseas', city: 'Chandigarh', country: 'India', tier: 'Tier 3', commissionRatePct: 18 },
  { name: 'Pacific Bridge Migration', city: 'Manila', country: 'Philippines', tier: 'Tier 2', commissionRatePct: 15 },
  { name: 'Sahel Study Partners', city: 'Lagos', country: 'Nigeria', tier: 'Tier 2', commissionRatePct: 15 },
  { name: 'Northstar Admissions', city: 'Delhi', country: 'India', tier: 'Tier 2', commissionRatePct: 15 },
  { name: 'Himalaya Pathways', city: 'Kathmandu', country: 'Nepal', tier: 'Tier 1', commissionRatePct: 12 },
  { name: 'Gulf Access Education', city: 'Dubai', country: 'UAE', tier: 'Tier 1', commissionRatePct: 12 },
  { name: 'Verde Advisors', city: 'São Paulo', country: 'Brazil', tier: 'Tier 1', commissionRatePct: 12 },
];

function slugEmail(name, domain) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')}@${domain}`;
}

async function upsertUser({ name, email, role, partnerId = null }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  return User.create({ name, email, password: DEV_PASSWORD, role, partnerId });
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected. Seeding Fee Ledger module...');

  // --- Programs --------------------------------------------------------------------------
  const programsByCode = {};
  for (const p of PROGRAMS) {
    const doc = await FeeProgram.findOneAndUpdate({ code: p.code }, p, { upsert: true, new: true, setDefaultsOnInsert: true });
    programsByCode[p.code] = doc;
  }
  console.log(`Programs seeded: ${Object.keys(programsByCode).join(', ')}`);

  // --- Partners ----------------------------------------------------------------------------
  const partners = [];
  for (const p of PARTNERS) {
    const doc = await FeePartner.findOneAndUpdate({ name: p.name }, p, { upsert: true, new: true, setDefaultsOnInsert: true });
    partners.push(doc);
  }
  console.log(`Partners seeded: ${partners.length}`);

  // --- Dev staff accounts ------------------------------------------------------------------
  let registrar = null;
  if (CREATE_USERS) {
    registrar = await upsertUser({ name: 'Riya Kapoor (Registrar)', email: 'registrar@canadadigitoba.dev', role: 'registrar' });
    for (const partner of partners) {
      const email = slugEmail(partner.name, 'partners.canadadigitoba.dev');
      const user = await upsertUser({ name: `${partner.name} (Partner Login)`, email, role: 'partner', partnerId: partner._id });
      if (!partner.userId) {
        partner.userId = user._id;
        await partner.save();
      }
    }
    console.log(`Dev staff accounts created — registrar + ${partners.length} partner logins, password: ${DEV_PASSWORD}`);
  } else {
    console.log('SEED_FEES_CREATE_USERS=false — skipped creating dev registrar/partner logins.');
  }

  // Clear previously-seeded demo students/events so this script is safely re-runnable.
  await FeeStudent.deleteMany({ sid: /^PIC-DEMO-/ });
  await FeeLedgerEvent.deleteMany({ text: /\[seed\]/ });

  const now = new Date();
  const cohortStart = new Date(now.getFullYear(), now.getMonth() + 1, 1); // 1st of next month

  const [pswde, fsw, moa, catp] = ['pswde', 'fsw', 'moa', 'catp'].map((c) => programsByCode[c]);
  const [maple, pacific, sahel, northstar, himalaya, gulf, verde] = partners;

  const demoStudents = [
    // --- intl students (agent-recruited) — a mix of held / cleared / overdue / mismatch ---
    { name: 'Amanpreet Singh', program: pswde, fundingType: 'intl', partner: maple, mutate: 'clearFirstTwo' },
    { name: 'Grace Dela Cruz', program: fsw, fundingType: 'intl', partner: pacific, mutate: 'holdSecond' },
    { name: 'Chioma Okafor', program: moa, fundingType: 'intl', partner: sahel, mutate: 'mismatch' }, // deliberate mismatch
    { name: 'Simran Kaur', program: catp, fundingType: 'intl', partner: northstar, mutate: 'overdue' },
    { name: 'Bikash Thapa', program: pswde, fundingType: 'intl', partner: himalaya, mutate: 'transit' },
    { name: 'Fatima Al-Farsi', program: fsw, fundingType: 'intl', partner: gulf, mutate: 'none' },
    { name: 'Larissa Souza', program: moa, fundingType: 'intl', partner: verde, mutate: 'clearFirstTwo' },

    // --- self-funding students (pay the college directly) ---
    { name: 'Michael Chen', program: pswde, fundingType: 'self', partner: null, mutate: 'clearFirstTwo' },
    { name: 'Olivia Martin', program: fsw, fundingType: 'self', partner: null, mutate: 'overdue' },
    { name: 'Daniel Osei', program: catp, fundingType: 'self', partner: null, mutate: 'none' },

    // --- BJO (ministry-funded) students ---
    { name: 'Priya Nair', program: moa, fundingType: 'bjo', partner: null, mutate: 'claim1Submitted' },
    { name: 'Jason Wong', program: fsw, fundingType: 'bjo', partner: null, mutate: 'none' },
  ];

  const createdEvents = [];
  let sidSeq = 1;
  for (const spec of demoStudents) {
    const instalments = buildPlan(spec.program, spec.fundingType, cohortStart);

    // Realistic mix of instalment states for the demo dataset — direct
    // mutation of seed rows, not the production transition functions
    // (those require role/precondition context that doesn't apply to
    // bulk-seeded historical-looking data).
    switch (spec.mutate) {
      case 'clearFirstTwo':
        instalments[0].status = 'cleared';
        instalments[0].collectedOn = new Date(cohortStart.getTime() - 90 * 86400000);
        instalments[0].receiptRef = 'RCPT-SEED-1 · confirmed by registrar';
        instalments[1].status = 'cleared';
        instalments[1].collectedOn = new Date(cohortStart.getTime() - 20 * 86400000);
        instalments[1].receiptRef = 'RCPT-SEED-2 · confirmed by registrar';
        break;
      case 'holdSecond':
        instalments[0].status = 'cleared';
        instalments[0].collectedOn = new Date(cohortStart.getTime() - 80 * 86400000);
        instalments[0].receiptRef = 'RCPT-SEED-3 · confirmed by registrar';
        instalments[1].status = 'agent';
        instalments[1].reportedCents = instalments[1].amountCents;
        instalments[1].collectedOn = new Date(now.getTime() - 3 * 86400000);
        break;
      case 'mismatch': {
        // The deliberate mismatch called for in the spec: reported $3,560 vs invoiced $3,900.
        const idx = instalments.length > 2 ? 2 : 0;
        instalments[idx].amountCents = 390000;
        instalments[idx].status = 'agent';
        instalments[idx].reportedCents = 356000;
        instalments[idx].collectedOn = new Date(now.getTime() - 5 * 86400000);
        break;
      }
      case 'overdue':
        instalments[0].status = 'cleared';
        instalments[0].collectedOn = new Date(cohortStart.getTime() - 90 * 86400000);
        instalments[0].receiptRef = 'RCPT-SEED-4 · confirmed by registrar';
        instalments[1].dueDate = new Date(now.getTime() - 15 * 86400000); // now overdue
        break;
      case 'transit':
        instalments[0].status = 'agent';
        instalments[0].batchRef = 'MC-SEED-01';
        instalments[0].reportedCents = instalments[0].amountCents;
        instalments[0].collectedOn = new Date(now.getTime() - 2 * 86400000);
        break;
      case 'claim1Submitted':
        instalments[0].status = 'funder';
        break;
      default:
        break;
    }

    const student = await FeeStudent.create({
      sid: `PIC-DEMO-${String(sidSeq).padStart(4, '0')}`,
      name: spec.name,
      email: slugEmail(spec.name, 'example.com'),
      phone: '+1 416 555 01' + String(sidSeq).padStart(2, '0'),
      programId: spec.program._id,
      fundingType: spec.fundingType,
      partnerId: spec.partner ? spec.partner._id : null,
      cohortStart,
      instalments,
      createdBy: registrar ? registrar._id : null,
    });
    sidSeq += 1;

    createdEvents.push({
      tag: 'NEW',
      tone: 'ok',
      text: `[seed] New ${spec.fundingType} student ${student.name} added to ${spec.program.name}.`,
      studentId: student._id,
      partnerId: student.partnerId,
      actorRole: 'registrar',
    });
  }

  // --- Three feed events (BUILD PROMPT section 7) ------------------------------------------
  await FeeLedgerEvent.insertMany([
    ...createdEvents.slice(0, 3),
    {
      tag: 'MISMATCH',
      tone: 'bad',
      text: '[seed] Chioma Okafor: partner reported $3,560.00, invoiced $3,900.00 (diff $340.00).',
      actorRole: 'partner',
    },
    {
      tag: 'REMIT',
      tone: 'info',
      text: '[seed] Batch MC-SEED-01: 1 instalment(s) sent for remittance.',
      actorRole: 'partner',
    },
    {
      tag: 'BJO',
      tone: 'info',
      text: '[seed] Priya Nair: BJO claim 1 submitted to the ministry.',
      actorRole: 'registrar',
    },
  ]);

  console.log(`Demo students seeded: ${demoStudents.length}`);
  console.log('Fee Ledger seed complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Fee Ledger seed failed:', err);
  process.exit(1);
});
