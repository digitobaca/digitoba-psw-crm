import { api } from '@/lib/api';

/**
 * All Fee Ledger API calls, isolated from the rest of the CRM's api.js per
 * the module's isolation rule. Reuses the shared, already-configured axios
 * instance (baseURL + withCredentials) instead of duplicating that setup.
 */
const BASE = '/fees';

// --- Programs --------------------------------------------------------------------------
export const fetchFeePrograms = () => api.get(`${BASE}/programs`).then((res) => res.data);
export const fetchFeeProgram = (id) => api.get(`${BASE}/programs/${id}`).then((res) => res.data);
export const createFeeProgram = (payload) => api.post(`${BASE}/programs`, payload).then((res) => res.data);
export const updateFeeProgram = (id, payload) => api.put(`${BASE}/programs/${id}`, payload).then((res) => res.data);

// --- Partners --------------------------------------------------------------------------
export const fetchFeePartners = () => api.get(`${BASE}/partners`).then((res) => res.data);
export const fetchFeePartner = (id) => api.get(`${BASE}/partners/${id}`).then((res) => res.data);
export const createFeePartner = (payload) => api.post(`${BASE}/partners`, payload).then((res) => res.data);
export const updateFeePartner = (id, payload) => api.put(`${BASE}/partners/${id}`, payload).then((res) => res.data);

// --- Students / ledger -------------------------------------------------------------------
export const fetchFeeStudents = (params) => api.get(`${BASE}/students`, { params }).then((res) => res.data);
export const fetchFeeStudent = (id) => api.get(`${BASE}/students/${id}`).then((res) => res.data);
export const createFeeStudent = (payload) => api.post(`${BASE}/students`, payload).then((res) => res.data);
export const fetchPlanPreview = (params) => api.get(`${BASE}/students/plan-preview`, { params }).then((res) => res.data);

export const logReceipt = (studentId, idx, payload) =>
  api.post(`${BASE}/students/${studentId}/instalments/${idx}/log-receipt`, payload).then((res) => res.data);
export const confirmReceipt = (studentId, idx) =>
  api.post(`${BASE}/students/${studentId}/instalments/${idx}/confirm`).then((res) => res.data);
export const recordDirectPayment = (studentId, idx, payload) =>
  api.post(`${BASE}/students/${studentId}/instalments/${idx}/record-direct`, payload).then((res) => res.data);
export const submitBjoClaim = (studentId, idx) =>
  api.post(`${BASE}/students/${studentId}/instalments/${idx}/submit-claim`).then((res) => res.data);

// --- Remittance batches ------------------------------------------------------------------
export const fetchFeeBatches = () => api.get(`${BASE}/batches`).then((res) => res.data);
export const createFeeBatch = (payload) => api.post(`${BASE}/batches`, payload).then((res) => res.data);
export const confirmFeeBatch = (ref) => api.post(`${BASE}/batches/${encodeURIComponent(ref)}/confirm`).then((res) => res.data);

// --- Commission --------------------------------------------------------------------------
export const fetchFeeCommission = () => api.get(`${BASE}/commission`).then((res) => res.data);

// --- Refunds -----------------------------------------------------------------------------
export const fetchFeeRefunds = () => api.get(`${BASE}/refunds`).then((res) => res.data);
export const previewFeeRefund = (payload) => api.post(`${BASE}/refunds/preview`, payload).then((res) => res.data);
export const approveFeeRefund = (payload) => api.post(`${BASE}/refunds`, payload).then((res) => res.data);

// --- Summary / alerts / feed ---------------------------------------------------------------
export const fetchFeeSummary = () => api.get(`${BASE}/summary`).then((res) => res.data);
export const fetchFeeAlerts = () => api.get(`${BASE}/alerts`).then((res) => res.data);
export const fetchFeeFeed = (limit = 40) => api.get(`${BASE}/feed`, { params: { limit } }).then((res) => res.data);
