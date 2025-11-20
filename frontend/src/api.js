const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api/v1';

function authHeaders(token) {
  return token ? { Authorization: 'Bearer ' + token } : {};
}

async function parseJsonSafe(res) {
  const text = await res.text();
  try {
    return JSON.parse(text || '{}');
  } catch (e) {
    return { __parseError: true, raw: text };
  }
}

export async function getJSON(path, token) {
  try {
    const res = await fetch(API_BASE + path, { headers: { ...authHeaders(token) } });
    if (res.status === 401) return { __unauthorized: true, error: 'Unauthorized' };
    if (res.status === 204) return {};
    return await parseJsonSafe(res);
  } catch (err) {
    return { __networkError: true, error: String(err) };
  }
}

export async function postJSON(path, body, token) {
  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
      body: JSON.stringify(body)
    });
    if (res.status === 401) return { __unauthorized: true, error: 'Unauthorized' };
    if (res.status === 204) return { ok: true };
    return await parseJsonSafe(res);
  } catch (err) {
    return { __networkError: true, error: String(err) };
  }
}

export async function del(path, token) {
  try {
    const res = await fetch(API_BASE + path, { method: 'DELETE', headers: { ...authHeaders(token) } });
    if (res.status === 401) return { __unauthorized: true, error: 'Unauthorized' };
    if (res.status === 204) return { ok: true };
    return await parseJsonSafe(res);
  } catch (err) {
    return { __networkError: true, error: String(err) };
  }
}
