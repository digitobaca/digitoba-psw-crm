/**
 * One-off migration: remaps any existing Student.pipelineStage values still
 * on the OLD 15-stage pipeline (New Lead → Contacted → Qualified →
 * Counselling → Profile Complete → College Shortlist → Documents →
 * Submitted for Review → Application → Offer → Deposit → Visa → Approved →
 * Pre-Departure → Student in Canada → Closed) onto the new pipeline
 * (New Lead → Cold Attempt 1/2/3 → Warm Lead → Hot Lead → Interested →
 * Enrolled, + Not Interested / Counselled Not Enrolled / Hold Lead / BJO).
 *
 * Necessary because the enum is enforced on write, not on read — old
 * records keep their old string forever unless something updates them, and
 * the FIRST edit anyone makes to one of those records (in the CRM UI or via
 * the API) would otherwise fail Mongoose's enum validation outright.
 *
 * The mapping below is a reasonable default, not a certainty — review the
 * dry-run output before applying, especially the `Closed` → `Not Interested`
 * guess (a closed lead could just as easily have been a hold or a
 * duplicate). Edit MAPPING below first if any of these don't fit your data.
 *
 * Usage:
 *   node seed/migratePipelineStages.js            # dry run — reports only, changes nothing
 *   node seed/migratePipelineStages.js --apply     # actually writes the changes
 */
require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');

const MAPPING = {
  'New Lead': 'New Lead', // unchanged — still a valid stage
  Contacted: 'Cold Attempt 1',
  Qualified: 'Warm Lead',
  Counselling: 'Warm Lead',
  'Profile Complete': 'Warm Lead',
  'College Shortlist': 'Hot Lead',
  Documents: 'Hot Lead',
  'Submitted for Review': 'Interested',
  Application: 'Interested',
  Offer: 'Interested',
  Deposit: 'Interested',
  Visa: 'Interested',
  Approved: 'Interested',
  'Pre-Departure': 'Enrolled',
  'Student in Canada': 'Enrolled',
  Closed: 'Not Interested', // best-guess default — review your actual Closed leads before trusting this
};

const run = async () => {
  const apply = process.argv.includes('--apply');

  await mongoose.connect(process.env.MONGO_URI);

  // Read with the raw driver, bypassing the schema's (new) enum, so this
  // still works even though some documents now hold values outside it.
  const raw = mongoose.connection.collection('students');
  const counts = await raw
    .aggregate([{ $group: { _id: '$pipelineStage', count: { $sum: 1 } } }])
    .toArray();

  console.log('Current pipelineStage distribution:');
  for (const { _id, count } of counts) console.log(`  ${_id}: ${count}`);

  const toMigrate = counts.filter(({ _id }) => Object.prototype.hasOwnProperty.call(MAPPING, _id) && MAPPING[_id] !== _id);
  const unknown = counts.filter(({ _id }) => !Object.prototype.hasOwnProperty.call(MAPPING, _id) && !Student.PIPELINE_STAGES.includes(_id) && !Student.TERMINAL_STAGES.includes(_id));

  if (toMigrate.length === 0 && unknown.length === 0) {
    console.log('\nNothing to migrate — every record already holds a valid new-pipeline stage.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`\n${apply ? 'Applying' : 'Would apply'} these changes:`);
  for (const { _id, count } of toMigrate) {
    console.log(`  ${_id} (${count} record${count === 1 ? '' : 's'}) → ${MAPPING[_id]}`);
  }
  if (unknown.length > 0) {
    console.log('\nWARNING — these values are not in the old OR new stage list (no mapping, left untouched):');
    for (const { _id, count } of unknown) console.log(`  ${_id}: ${count}`);
  }

  if (!apply) {
    console.log('\nDry run only — no changes made. Re-run with --apply to actually update these records.');
    await mongoose.disconnect();
    process.exit(0);
  }

  for (const { _id: oldStage } of toMigrate) {
    const newStage = MAPPING[oldStage];
    const result = await raw.updateMany({ pipelineStage: oldStage }, { $set: { pipelineStage: newStage } });
    console.log(`Updated ${result.modifiedCount} record(s): ${oldStage} → ${newStage}`);
  }

  console.log('\nDone.');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
