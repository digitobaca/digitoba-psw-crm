/**
 * Seeds a handful of well-known Canadian institutions as UNVERIFIED sample
 * records so the Colleges/Programs UI has something to render in dev.
 *
 * IMPORTANT: every record here is created with `verified: false` and every
 * numeric field (tuition, deadlines, requirements) is a rough placeholder,
 * NOT researched/confirmed data — per the project rule that admission and
 * tuition facts must come from actual staff review, never be invented.
 * A staff member must review and flip `verified: true` (via PUT
 * /api/colleges/:id or /api/programs/:id) before this ever reaches a
 * student-facing recommendation.
 *
 * Usage: npm run seed:colleges
 */
require('dotenv').config();
const mongoose = require('mongoose');
const College = require('../models/College');
const Program = require('../models/Program');

const SAMPLE_COLLEGES = [
  {
    name: 'Centennial College',
    campuses: ['Toronto', 'Scarborough'],
    province: 'Ontario',
    website: 'https://www.centennialcollege.ca',
    isDesignatedLearningInstitution: true,
    internalNotes: 'SAMPLE SEED DATA — unverified. Confirm all details before use.',
  },
  {
    name: 'Conestoga College',
    campuses: ['Kitchener', 'Waterloo'],
    province: 'Ontario',
    website: 'https://www.conestogac.on.ca',
    isDesignatedLearningInstitution: true,
    internalNotes: 'SAMPLE SEED DATA — unverified. Confirm all details before use.',
  },
  {
    name: 'Seneca Polytechnic',
    campuses: ['Toronto', 'Markham'],
    province: 'Ontario',
    website: 'https://www.senecapolytechnic.ca',
    isDesignatedLearningInstitution: true,
    internalNotes: 'SAMPLE SEED DATA — unverified. Confirm all details before use.',
  },
  {
    name: 'University of Manitoba',
    campuses: ['Winnipeg'],
    province: 'Manitoba',
    website: 'https://umanitoba.ca',
    isDesignatedLearningInstitution: true,
    internalNotes: 'SAMPLE SEED DATA — unverified. Confirm all details before use.',
  },
];

// One illustrative program per college, including a PSW program (ties the
// two verticals together in the same database).
const SAMPLE_PROGRAMS_BY_COLLEGE = {
  'Centennial College': {
    name: 'Personal Support Worker',
    level: 'PSW Certificate',
    field: 'Healthcare',
    durationMonths: 8,
    intakes: ['Jan', 'May', 'Sep'],
  },
  'Conestoga College': {
    name: 'Business Administration',
    level: 'Diploma',
    field: 'Business',
    durationMonths: 24,
    intakes: ['Jan', 'Sep'],
  },
  'Seneca Polytechnic': {
    name: 'Computer Programming and Analysis',
    level: 'Diploma',
    field: 'IT',
    durationMonths: 24,
    intakes: ['Jan', 'May', 'Sep'],
  },
  'University of Manitoba': {
    name: 'Master of Business Administration',
    level: 'Master',
    field: 'Business',
    durationMonths: 20,
    intakes: ['Sep'],
  },
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const collegeData of SAMPLE_COLLEGES) {
    let college = await College.findOne({ name: collegeData.name });
    if (!college) {
      college = await College.create(collegeData);
      console.log(`Created college: ${college.name}`);
    } else {
      console.log(`College already exists, skipping: ${college.name}`);
    }

    const programData = SAMPLE_PROGRAMS_BY_COLLEGE[collegeData.name];
    if (programData) {
      const existingProgram = await Program.findOne({ college: college._id, name: programData.name });
      if (!existingProgram) {
        await Program.create({
          ...programData,
          college: college._id,
          tuitionCurrency: 'CAD',
          internalNotes: 'SAMPLE SEED DATA — unverified. Confirm tuition/requirements before use.',
        });
        console.log(`  Created program: ${programData.name}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log('\nDone. Remember: these are all unverified sample records — review and mark verified:true before relying on them.');
  process.exit(0);
};

run().catch((err) => {
  console.error('Seeding colleges failed:', err.message);
  process.exit(1);
});
