const mongoose = require('mongoose');

/**
 * Internal implementation detail (not part of the domain vocabulary in the
 * spec) — a tiny atomic counter collection used to mint sequence numbers for
 * student SIDs ("PIC-YY-NNNN") and receipt refs ("RCPT-<seq>",
 * "MTCU-<year>-<seq>") without a race condition. See services/sequence.js.
 */
const FeeCounterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // counter name, e.g. "sid-26", "rcpt", "mtcu-2026"
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('FeeCounter', FeeCounterSchema);
