/**
 * Derives the status the UI renders from an instalment's stored state — the
 * server is the only place this is computed (constraint #4). See BUILD
 * PROMPT section 3 (FeeInstalment) for the exact rule.
 *
 * - 'transit' if status === 'agent' and batchRef is set (wired, unconfirmed)
 * - 'overdue' if status === 'due' and dueDate < now and not cancelled
 * - otherwise the stored status
 */
function effectiveStatus(instalment, now = new Date()) {
  if (instalment.status === 'agent' && instalment.batchRef) return 'transit';
  if (instalment.status === 'due' && !instalment.cancelled && new Date(instalment.dueDate) < new Date(now)) {
    return 'overdue';
  }
  return instalment.status;
}

module.exports = effectiveStatus;
