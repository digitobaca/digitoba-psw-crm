const { FeeCounter } = require('../models');

/** Atomically returns the next integer in a named sequence (starts at 1). */
async function nextSeq(name) {
  const doc = await FeeCounter.findByIdAndUpdate(name, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return doc.seq;
}

/** Generates the next student SID: "PIC-YY-NNNN" (two-digit year, 4-digit zero-padded sequence, reset per year). */
async function nextSid(now = new Date()) {
  const yy = String(now.getFullYear()).slice(-2);
  const seq = await nextSeq(`sid-${yy}`);
  return `PIC-${yy}-${String(seq).padStart(4, '0')}`;
}

/** Generates the next "RCPT-<seq>" receipt reference (shared sequence across all confirm/direct/batch confirmations). */
async function nextRcpt() {
  const seq = await nextSeq('rcpt');
  return `RCPT-${seq}`;
}

/** Generates the next "MTCU-<year>-<seq>" ministry deposit reference for BJO claims. */
async function nextMtcu(now = new Date()) {
  const year = now.getFullYear();
  const seq = await nextSeq(`mtcu-${year}`);
  return `MTCU-${year}-${seq}`;
}

module.exports = { nextSeq, nextSid, nextRcpt, nextMtcu };
