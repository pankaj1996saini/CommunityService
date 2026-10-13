import { get, post, put, patch } from './client';

// turns { a: 1, b: '' , c: undefined } into "?a=1"
const qs = (params = {}) => {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
  return parts.length ? `?${parts.join('&')}` : '';
};

export const authApi = {
  login: (email, password) => post('/auth/login', { email, password }),
  register: (body) => post('/auth/register', body),
  me: () => get('/auth/me'),
  updateMe: (body) => put('/auth/me', body),
};

export const complaintApi = {
  list: (params) => get(`/complaints${qs(params)}`),
  get: (id) => get(`/complaints/${id}`),
  create: (form) => post('/complaints', form),
  assign: (id, body) => patch(`/complaints/${id}/assign`, body),
  setPriority: (id, priority) => patch(`/complaints/${id}/priority`, { priority }),
  // body: plain object, or FormData when there are photos
  updateStatus: (id, body) => patch(`/complaints/${id}/status`, body),
  feedback: (id, body) => post(`/complaints/${id}/feedback`, body),
};

export const statsApi = {
  get: () => get('/stats'),
};

export const userApi = {
  list: (params) => get(`/users${qs(params)}`),
  staff: () => get('/users/staff'),
  create: (body) => post('/users', body),
  update: (id, body) => patch(`/users/${id}`, body),
};

export const notificationApi = {
  list: () => get('/notifications'),
  markRead: (id) => patch(`/notifications/${id}/read`),
  markAllRead: () => patch('/notifications/read-all'),
};
