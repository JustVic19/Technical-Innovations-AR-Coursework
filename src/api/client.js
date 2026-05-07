// Central API helper — adds JWT from localStorage to every request
const API_BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('sentinel_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const error = new Error(data.error || `Request failed: ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return res.json();
}

/**
 * Generic entity factory — produces the same .list / .create / .update / .delete
 * interface that pages previously called on base44.entities.*
 */
export function createEntity(resource) {
  return {
    list: (order, limit) => {
      const params = new URLSearchParams();
      if (order) params.set('order', order);
      if (limit) params.set('limit', String(limit));
      const qs = params.toString();
      return request(`/${resource}${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request(`/${resource}`, { method: 'POST', body: data }),
    update: (id, data) => request(`/${resource}/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/${resource}/${id}`, { method: 'DELETE' }),
  };
}

/**
 * Auth helper — wraps /api/auth endpoints
 */
export const authClient = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request('/auth/me'),
};
