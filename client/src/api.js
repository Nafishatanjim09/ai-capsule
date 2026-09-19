// api.js — thin wrapper around fetch() for talking to the Express API.
// credentials: "include" ensures the HttpOnly "token" cookie is sent along
// with every request, since the frontend and API share one origin.

async function request(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (res.status === 401) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body && body.error) message = body.error;
    } catch {
      /* ignore non-JSON error bodies */
    }
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  me: () => request('/api/me'),
  logout: () => request('/api/logout', { method: 'POST' }),
  listCapsules: () => request('/api/capsules'),
  createCapsule: (data) =>
    request('/api/capsules', { method: 'POST', body: JSON.stringify(data) }),
  updateCapsule: (id, data) =>
    request(`/api/capsules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCapsule: (id) => request(`/api/capsules/${id}`, { method: 'DELETE' }),
};
