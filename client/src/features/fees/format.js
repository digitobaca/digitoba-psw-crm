/** Formats integer cents as CAD, e.g. 954500 -> "$9,545". Money is stored in cents server-side; only the client formats it for display (constraint #3). */
export function formatMoney(cents) {
  if (cents == null) return '—';
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`;
}

/** Formats an ISO date/Date as e.g. "Sep 1, 2026". */
export function formatFeeDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** True when a Date (or ISO string) is in the past relative to now. */
export function isPast(date) {
  return date ? new Date(date).getTime() < Date.now() : false;
}
