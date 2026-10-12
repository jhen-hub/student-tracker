const API_BASE_URL = import.meta.env.VITE_API_URL;

if (!API_BASE_URL) {
  console.warn('VITE_API_URL is not defined in environment variables');
}

export class ApiError extends Error {
  constructor(status, statusText, body) {
    super(`API ${status} ${statusText}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let body = null;
    try { body = await response.json(); } catch { /* non-JSON error body */ }
    throw new ApiError(response.status, response.statusText, body);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  post: (endpoint, data) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(data ?? {}),
  }),
  patch: (endpoint, data) => request(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  delete: (endpoint, data) => request(endpoint, {
    method: 'DELETE',
    ...(data ? { body: JSON.stringify(data) } : {}),
  }),
};