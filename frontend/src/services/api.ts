import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor per aggiungere token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor per gestire errori auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then(res => res.data),
  verifyLoginOtp: (email: string, code: string, tempToken: string) =>
    api.post('/auth/verify-login-otp', { email, code, tempToken }).then(res => res.data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: { name?: string; password?: string; currentPassword?: string }) =>
    api.put('/auth/profile', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  validateResetToken: (token: string) =>
    api.get('/auth/validate-reset-token', { params: { token } }),
  // Two-Factor Authentication - Toggle semplice come GADS Audit
  toggle2FA: (enabled: boolean) =>
    api.patch('/auth/2fa', { enabled }).then(res => res.data),
};

// Time Entries
export const timeEntriesApi = {
  getByDate: (date: string) => api.get('/time-entries', { params: { date } }),
  create: (data: { projectId: string; date: string; durationMinutes: number; notes?: string }) =>
    api.post('/time-entries', data),
  update: (id: string, data: { projectId?: string; date?: string; durationMinutes?: number; notes?: string }) =>
    api.put(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
};

// Day Status
export const dayStatusApi = {
  getByDate: (date: string) => api.get('/day-status', { params: { date } }),
  getTodaySummary: () => api.get('/day-status/today-summary'),
  close: (date?: string) => api.post('/day-status/close', { date }),
  reopen: (date?: string) => api.post('/day-status/reopen', { date }),
  setDayOff: (date?: string) => api.post('/day-status/day-off', { date }),
  removeDayOff: (date?: string) => api.post('/day-status/remove-day-off', { date }),
};

// Weekly
export const weeklyApi = {
  getCurrent: (weekStart?: string) =>
    api.get('/weekly/current', { params: weekStart ? { weekStart } : {} }),
  submit: (weekStart?: string) =>
    api.post('/weekly/submit', weekStart ? { weekStart } : {}),
};

// Projects
export const projectsApi = {
  getAssigned: () => api.get('/projects/assigned'),
};

// Notifications
export const notificationsApi = {
  getPending: () => api.get('/notifications/pending').then(res => res.data),
};

// Admin
export const adminApi = {
  // Users
  getUsers: () => api.get('/admin/users'),
  createUser: (data: any) => api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Projects
  getProjects: () => api.get('/admin/projects'),
  getProject: (id: string) => api.get(`/admin/projects/${id}`),
  createProject: (data: { name: string; code?: string; active?: boolean }) =>
    api.post('/admin/projects', data),
  updateProject: (id: string, data: { name?: string; code?: string; active?: boolean }) =>
    api.put(`/admin/projects/${id}`, data),
  deleteProject: (id: string) => api.delete(`/admin/projects/${id}`),
  assignUsers: (projectId: string, userIds: string[]) =>
    api.post(`/admin/projects/${projectId}/assign`, { userIds }),

  // Compliance
  getCompliance: () => api.get('/admin/compliance'),
  getUserWeekDetail: (userId: string, weekStart?: string) =>
    api.get(`/admin/users/${userId}/week`, { params: { weekStart } }),

  // Export
  exportCsv: (from: string, to: string) =>
    api.get('/admin/export', {
      params: { from, to },
      responseType: 'blob',
    }),

};
