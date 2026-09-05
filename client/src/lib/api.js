import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Shared axios instance for staff (admin/counsellor). `withCredentials: true`
 * lets the browser send/receive the HTTP-only JWT cookie (cd_token).
 */
const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Separate instance for the student portal — same backend, but portal
 * sessions use a different cookie (cd_portal_token) so a staff session and a
 * portal session never collide in the same browser.
 */
export const portalApi = axios.create({
  baseURL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
// Exported (in addition to the default export) so the isolated Fee Ledger
// feature module (client/src/features/fees/api.js) can reuse the same
// configured axios instance/baseURL/credentials without duplicating it.
export { api };

// --- Public: lead capture ---------------------------------------------------------
/**
 * Every lead form on the site funnels through here, which is exactly why
 * this is where UTM campaign attribution lives — one place, so a Meta/Google
 * ad's ?utm_campaign=<slug> link gets picked up no matter which form the
 * click lands on, without each form needing to know about it. The backend
 * matches it against an AdCampaign.utmSlug (Ads Dashboard) automatically.
 */
export const submitLead = (payload) => {
  const utmCampaign = new URLSearchParams(window.location.search).get('utm_campaign');
  return api.post('/students', { ...payload, ...(utmCampaign && !payload.utmCampaign ? { utmCampaign } : {}) }).then((res) => res.data);
};
export const submitDeletionRequest = (payload) => api.post('/deletion-requests', payload).then((res) => res.data);

// --- Public: colleges/programs (verified entries only) ----------------------------
export const fetchPublicColleges = (params) => api.get('/colleges', { params }).then((res) => res.data);
export const fetchPublicPrograms = (params) => api.get('/programs', { params }).then((res) => res.data);

// --- Staff auth ---------------------------------------------------------------------
export const login = (email, password) => api.post('/auth/login', { email, password }).then((res) => res.data);
export const logout = (summary) => api.post('/auth/logout', { summary }).then((res) => res.data);
export const fetchMe = () => api.get('/auth/me').then((res) => res.data);

// --- Counsellor management (admin) ---------------------------------------------------
export const fetchCounsellors = () => api.get('/auth/counsellors').then((res) => res.data);
export const createCounsellor = (payload) => api.post('/auth/counsellors', payload).then((res) => res.data);
export const updateCounsellor = (id, payload) => api.put(`/auth/counsellors/${id}`, payload).then((res) => res.data);

// --- Attendance (shift start on login / shift end on logout) -------------------------------
export const fetchAttendance = (params) => api.get('/attendance', { params }).then((res) => res.data);

/** Downloads the filtered attendance report as an .xlsx file (admin only). */
export const downloadAttendanceExport = async (params) => {
  const res = await api.get('/attendance/export', { params, responseType: 'blob' });
  const disposition = res.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : 'attendance-report.xlsx';
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// --- Students / CRM pipeline (staff) ---------------------------------------------------
export const fetchStudents = (params) => api.get('/students', { params }).then((res) => res.data);
/** Count of brand-new, not-yet-actioned leads (scoped to own students for a counsellor) — feeds the "New Leads" nav badge. */
export const fetchNewLeadsCount = () => fetchStudents({ pipelineStage: 'New Lead', limit: 1 }).then((res) => res.pagination.total);
export const fetchStudent = (id) => api.get(`/students/${id}`).then((res) => res.data);
export const updateStudent = (id, payload) => api.put(`/students/${id}`, payload).then((res) => res.data);
export const deleteStudent = (id) => api.delete(`/students/${id}`).then((res) => res.data);
export const addStudentNote = (id, text) => api.post(`/students/${id}/notes`, { text }).then((res) => res.data);
export const activateStudentPortal = (id) => api.post(`/students/${id}/activate-portal`).then((res) => res.data);

// --- Colleges / Programs (staff CRUD) ---------------------------------------------------
export const fetchColleges = (params) => api.get('/colleges', { params }).then((res) => res.data);
export const createCollege = (payload) => api.post('/colleges', payload).then((res) => res.data);
export const updateCollege = (id, payload) => api.put(`/colleges/${id}`, payload).then((res) => res.data);
export const deleteCollege = (id) => api.delete(`/colleges/${id}`).then((res) => res.data);

export const fetchPrograms = (params) => api.get('/programs', { params }).then((res) => res.data);
export const createProgram = (payload) => api.post('/programs', payload).then((res) => res.data);
export const updateProgram = (id, payload) => api.put(`/programs/${id}`, payload).then((res) => res.data);
export const deleteProgram = (id) => api.delete(`/programs/${id}`).then((res) => res.data);

// --- Applications ---------------------------------------------------------------------
export const fetchApplications = (params) => api.get('/applications', { params }).then((res) => res.data);
export const fetchApplicationById = (id) => api.get(`/applications/${id}`).then((res) => res.data);
export const createApplication = (payload) => api.post('/applications', payload).then((res) => res.data);
export const updateApplication = (id, payload) => api.put(`/applications/${id}`, payload).then((res) => res.data);

// --- Documents ---------------------------------------------------------------------------
export const fetchDocuments = (params) => api.get('/documents', { params }).then((res) => res.data);
export const uploadDocument = (formData) =>
  api.post('/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
export const updateDocument = (id, payload) => api.put(`/documents/${id}`, payload).then((res) => res.data);

// --- Payments ---------------------------------------------------------------------------
export const fetchPayments = (params) => api.get('/payments', { params }).then((res) => res.data);
export const createPayment = (payload) => api.post('/payments', payload).then((res) => res.data);
export const updatePayment = (id, payload) => api.put(`/payments/${id}`, payload).then((res) => res.data);

// --- Tasks -------------------------------------------------------------------------------
export const fetchTasks = (params) => api.get('/tasks', { params }).then((res) => res.data);
export const createTask = (payload) => api.post('/tasks', payload).then((res) => res.data);
export const updateTask = (id, payload) => api.put(`/tasks/${id}`, payload).then((res) => res.data);

// --- Communications -----------------------------------------------------------------------
export const fetchCommunications = (studentId, type) =>
  api.get('/communications', { params: { student: studentId, type } }).then((res) => res.data);
export const createCommunication = (payload) => api.post('/communications', payload).then((res) => res.data);
export const fetchInbox = () => api.get('/communications/inbox').then((res) => res.data);
export const fetchUnreadCount = () => api.get('/communications/unread-count').then((res) => res.data);

// --- Analytics (admin) ---------------------------------------------------------------------
export const fetchAnalyticsOverview = () => api.get('/analytics/overview').then((res) => res.data);

// --- Ads Dashboard (admin) ------------------------------------------------------------------
export const fetchAdCampaigns = (params) => api.get('/ad-campaigns', { params }).then((res) => res.data);
export const fetchAdCampaignOverview = () => api.get('/ad-campaigns/overview').then((res) => res.data);
export const createAdCampaign = (payload) => api.post('/ad-campaigns', payload).then((res) => res.data);
export const updateAdCampaign = (id, payload) => api.put(`/ad-campaigns/${id}`, payload).then((res) => res.data);
export const deleteAdCampaign = (id) => api.delete(`/ad-campaigns/${id}`).then((res) => res.data);

// --- Student portal ---------------------------------------------------------------------
export const portalLogin = (email, password) => portalApi.post('/portal/login', { email, password }).then((res) => res.data);
export const portalLogout = () => portalApi.post('/portal/logout').then((res) => res.data);
export const fetchPortalMe = () => portalApi.get('/portal/me').then((res) => res.data);
export const fetchPortalProfile = () => portalApi.get('/portal/profile').then((res) => res.data);
export const updatePortalProfile = (payload) => portalApi.put('/portal/profile', payload).then((res) => res.data);
export const changePortalPassword = (payload) => portalApi.put('/portal/password', payload).then((res) => res.data);
export const fetchPortalDocuments = () => portalApi.get('/portal/documents').then((res) => res.data);
export const uploadPortalDocument = (formData) =>
  portalApi.post('/portal/documents', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data);
export const fetchPortalApplications = () => portalApi.get('/portal/applications').then((res) => res.data);
export const fetchPortalPayments = () => portalApi.get('/portal/payments').then((res) => res.data);
export const fetchPortalMessages = () => portalApi.get('/portal/messages').then((res) => res.data);
export const sendPortalMessage = (message) => portalApi.post('/portal/messages', { message }).then((res) => res.data);
