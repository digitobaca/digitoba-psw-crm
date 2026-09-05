/** Adds (fractional-safe, rounded to whole days) days to a Date, returning a new Date. */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + Math.round(days));
  return d;
}

/** Whole days between two dates (b - a), can be negative. */
function daysBetween(a, b) {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / MS_PER_DAY);
}

module.exports = { addDays, daysBetween };
