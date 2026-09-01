import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merges conditional class names and resolves Tailwind conflicts. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** Formats an ISO date string as e.g. "Aug 14, 2026". */
export function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Formats an ISO date string as e.g. "9:42 AM". */
export function formatTime(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Formats a minute count as e.g. "7h 15m" (or "32m" under an hour). */
export function formatDuration(minutes) {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Formats a number as CAD currency, e.g. "$1,024" (no decimals — ad spend/revenue is tracked in whole dollars). */
export function formatCurrency(amount) {
  if (amount == null) return '—';
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

/** Formats a 0-1 fraction as a percentage, e.g. 0.0862 -> "8.6%". Returns "—" for null (metric not computable, e.g. divide by zero). */
export function formatPercent(fraction, decimals = 1) {
  if (fraction == null) return '—';
  return `${(fraction * 100).toFixed(decimals)}%`;
}

/** Formats a ratio as e.g. "5.6x" (ROAS) — same null-safety as formatPercent. */
export function formatMultiple(value, decimals = 1) {
  if (value == null) return '—';
  return `${value.toFixed(decimals)}x`;
}

/**
 * Resolves a stored `fileUrl` (e.g. "/uploads/xyz.pdf") to an openable
 * absolute URL. Uploaded files are served from the API server's root, not
 * under `/api` and not from the Vite dev server — so this can't just be a
 * relative link.
 */
export function resolveFileUrl(fileUrl) {
  if (!fileUrl) return '';
  const apiOrigin = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
  return `${apiOrigin}${fileUrl}`;
}
