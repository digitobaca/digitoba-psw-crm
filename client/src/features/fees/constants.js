// Kept in sync with the effective statuses in server/src/modules/fees/services/effectiveStatus.js
// and the colours specified in the BUILD PROMPT.
export const STATUS_COLORS = {
  cleared: '#2F6B47',
  agent: '#C4821F',
  transit: '#6E5F91',
  funder: '#4B7898',
  due: '#D6CFC1',
  overdue: '#A8342A',
};

export const STATUS_LABELS = {
  cleared: 'Cleared',
  agent: 'Held by agent',
  transit: 'In transit',
  funder: 'Claimed from BJO',
  due: 'Not yet due',
  overdue: 'Overdue',
};

// Badge variants (client/src/components/ui/badge.jsx only ships default/secondary/outline/success/warning/info)
export const STATUS_BADGE_VARIANT = {
  cleared: 'success',
  agent: 'warning',
  transit: 'info',
  funder: 'info',
  due: 'secondary',
  overdue: 'destructive', // falls back to default styling below since badge.jsx has no destructive variant
};

export const FUNDING_LABELS = {
  intl: 'International (agent)',
  self: 'Self-funding',
  bjo: 'Better Jobs Ontario',
};

export const CHANNEL_LABELS = {
  agent: 'Pays via partner',
  direct: 'Pays college directly',
  funder: 'Ministry claim',
};

export const REASON_LABELS = {
  rescind: 'Cancelled within 2 days of signing (s. 25 — full refund)',
  before: 'Withdrew before the program began (s. 26 — all but service fee)',
  visa: 'Could not obtain a study permit (s. 26/32 — treated as withdrawal)',
  after: 'Withdrew/expelled after the program began (s. 27 — partial only before midpoint)',
};

export const TAG_TONE = {
  NEW: 'ok',
  'AGENT WRITE': 'warn',
  MISMATCH: 'bad',
  CONFIRMED: 'ok',
  DIRECT: 'ok',
  BJO: 'info',
  REMIT: 'info',
  RECONCILED: 'ok',
  REFUND: 'warn',
  CANCELLED: 'bad',
};

export const TONE_BADGE_VARIANT = { ok: 'success', warn: 'warning', info: 'info', bad: 'destructive' };
