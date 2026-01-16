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
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (data: { name?: string; password?: string; currentPassword?: string }) =>
    api.put('/auth/profile', data),
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
};

// Weekly
export const weeklyApi = {
  getCurrent: () => api.get('/weekly/current'),
  submit: () => api.post('/weekly/submit'),
};

// Projects
export const projectsApi = {
  getAssigned: () => api.get('/projects/assigned'),
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

  // Export
  exportCsv: (from: string, to: string) =>
    api.get('/admin/export', {
      params: { from, to },
      responseType: 'blob',
    }),
};
