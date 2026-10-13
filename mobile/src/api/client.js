import { API_URL } from '../config';

let authToken = null;
let onUnauthorized = null;

export const setToken = (t) => {
  authToken = t;
};
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details || {}; // { field: 'message' } from the server's validation
  }
}

// body can be a plain object (sent as JSON) or a FormData (sent as multipart)
async function request(path, { method = 'GET', body, timeout = 20000 } = {}) {
  const headers = { Accept: 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  let payload;
  if (body instanceof FormData) {
    payload = body; // fetch sets the multipart boundary itself, don't touch Content-Type
  } else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  let res;
  try {
    res = await fetch(`${API_URL}/api${path}`, { method, headers, body: payload, signal: controller.signal });
  } catch (err) {
    throw new ApiError(
      err.name === 'AbortError'
        ? 'The server took too long to respond. Please try again.'
        : "Can't reach the server. Check your connection and that the API is running.",
      0
    );
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // empty or non-JSON body, fall through
  }

  if (!res.ok) {
    // a 401 while we think we're logged in means the token died, so bounce to login
    if (res.status === 401 && authToken && onUnauthorized) onUnauthorized();
    throw new ApiError((data && data.message) || `Request failed (${res.status})`, res.status, data && data.errors);
  }
  return data;
}

export const get = (path) => request(path);
export const post = (path, body) => request(path, { method: 'POST', body, timeout: body instanceof FormData ? 60000 : 20000 });
export const put = (path, body) => request(path, { method: 'PUT', body });
export const patch = (path, body) => request(path, { method: 'PATCH', body, timeout: body instanceof FormData ? 60000 : 20000 });
