const RAW_API_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_API_URL ? `${RAW_API_URL.replace(/\/$/, '')}/api` : '/api';

export async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const token = localStorage.getItem('gem_auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorJson = await res.json();
        errorMsg = errorJson.detail || errorJson.message || errorMsg;
      } catch (_) {}
      throw new Error(errorMsg);
    }
    return await res.json();
  } catch (err) {
    console.error(`API Error on ${url}:`, err);
    throw err;
  }
}

export const api = {
  // System
  getSystemStatus: () => fetchApi('/system/status'),
  updateSystemConfig: (data) => fetchApi('/system/config', { method: 'POST', body: JSON.stringify(data) }),

  // Dashboard
  getDashboardStats: () => fetchApi('/dashboard/stats'),

  // Tenders
  getTenders: (statusFilter) => fetchApi(`/tenders${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
  getTender: (id) => fetchApi(`/tenders/${encodeURIComponent(id)}`),
  createTender: (data) => fetchApi('/tenders', { method: 'POST', body: JSON.stringify(data) }),
  updateTender: (id, data) => fetchApi(`/tenders/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  uploadTenderDoc: (formData) => fetchApi('/tenders/upload-doc', { method: 'POST', body: formData }),
  confirmTenderRequirements: (id, reqs) => fetchApi(`/tenders/${encodeURIComponent(id)}/confirm-requirements`, { method: 'POST', body: JSON.stringify(reqs) }),

  // Bidders
  getBidders: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) searchParams.append(k, v);
    });
    return fetchApi(`/bidders?${searchParams.toString()}`);
  },
  getBidder: (id, tenderId) => fetchApi(`/bidders/${id}${tenderId ? `?tender_id=${encodeURIComponent(tenderId)}` : ''}`),
  createBidder: (data) => fetchApi('/bidders', { method: 'POST', body: JSON.stringify(data) }),
  updateBidder: (id, data) => fetchApi(`/bidders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  recordOfficerReview: (id, data) => fetchApi(`/bidders/${id}/review`, { method: 'POST', body: JSON.stringify(data) }),
  compareBidders: (bidderIds, tenderId) => fetchApi('/bidders/compare', {
    method: 'POST',
    body: JSON.stringify({ bidder_ids: bidderIds, tender_id: tenderId })
  }),
  getVerificationQueue: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, v); });
    return fetchApi(`/queue?${sp.toString()}`);
  },
  getHealth: () => fetchApi('/health'),
  reseedDatabase: () => fetchApi('/bidders/reseed', { method: 'POST' }),

  // Documents
  getDocuments: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, v); });
    return fetchApi(`/documents?${sp.toString()}`);
  },
  uploadDocument: (formData) => fetchApi('/documents/upload', { method: 'POST', body: formData }),
  loadDemoCase: (data) => fetchApi('/documents/load-demo-case', { method: 'POST', body: JSON.stringify(data) }),
  getDemoCases: () => fetchApi('/documents/demo-cases'),
  getDocumentEvidence: (id) => fetchApi(`/documents/${id}/evidence`),
  deleteDocument: (id) => fetchApi(`/documents/${id}`, { method: 'DELETE' }),

  // Compliance
  runCompliance: (bidderId, tenderId) => fetchApi('/compliance/run', {
    method: 'POST',
    body: JSON.stringify({ bidder_id: bidderId, tender_id: tenderId })
  }),
  getBidderCompliance: (bidderId, tenderId) => fetchApi(`/compliance/${bidderId}${tenderId ? `?tender_id=${encodeURIComponent(tenderId)}` : ''}`),
  explainRule: (bidderId, ruleId, tenderId) => fetchApi('/compliance/explain', {
    method: 'POST',
    body: JSON.stringify({ bidder_id: bidderId, rule_id: ruleId, tender_id: tenderId })
  }),

  // Government
  getGovernmentVerifications: (bidderId) => fetchApi(`/government/${bidderId}`),
  verifyAllGovernment: (bidderId, tenderId) => fetchApi('/government/verify-all', {
    method: 'POST',
    body: JSON.stringify({ bidder_id: bidderId, tender_id: tenderId })
  }),

  // Audit
  getAuditLogs: (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v) sp.append(k, v); });
    return fetchApi(`/audit?${sp.toString()}`);
  },

  // Reports
  getReport: (tenderId, bidderId) => fetchApi(`/reports/${bidderId}${tenderId ? `?tender_id=${encodeURIComponent(tenderId)}` : ''}`),
};
