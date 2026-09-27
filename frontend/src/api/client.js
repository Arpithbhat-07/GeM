export function getApiBaseUrl() {
  if (typeof window !== 'undefined') {
    // 1. Query parameter override: ?api=https://backend.onrender.com
    const params = new URLSearchParams(window.location.search);
    const queryApi = params.get('api') || params.get('apiUrl') || params.get('backend');
    if (queryApi) {
      const clean = queryApi.trim().replace(/\/+$/, '');
      localStorage.setItem('gem_api_url', clean);
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }

    // 2. Persisted user configuration in localStorage
    const stored = localStorage.getItem('gem_api_url');
    if (stored) {
      const clean = stored.trim().replace(/\/+$/, '');
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
  }

  // 3. Build-time environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  // 4. Default to relative /api for local Vite proxy and reverse proxies
  return '/api';
}

export function setApiBaseUrl(newUrl) {
  if (typeof window !== 'undefined') {
    if (!newUrl) {
      localStorage.removeItem('gem_api_url');
    } else {
      localStorage.setItem('gem_api_url', newUrl.trim().replace(/\/+$/, ''));
    }
  }
}

export async function fetchApi(endpoint, options = {}) {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // If body is FormData, delete Content-Type so browser sets boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('gem_auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    const contentType = res.headers.get('content-type') || '';

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        if (contentType.includes('application/json')) {
          const errorJson = await res.json();
          errorMsg = errorJson.detail || errorJson.message || errorMsg;
        } else {
          errorMsg = await res.text();
        }
      } catch (_) {}
      throw new Error(errorMsg);
    }

    // Safety guard: if server returns HTML (e.g. Vercel SPA index.html fallback for unmatched /api routes)
    if (contentType.includes('text/html')) {
      throw new Error(
        `API gateway at '${url}' returned HTML instead of JSON. Ensure your deployed backend API URL is configured in Settings or VITE_API_URL.`
      );
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
