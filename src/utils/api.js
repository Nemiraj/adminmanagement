import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_BASE = process.env.REACT_APP_API_URL || 'https://adminmanagementbackend.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle common errors
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response) {
      // Server responded with an error
      if (err.response.status === 401) {
        const isAuthCheck = err.config?.url?.includes('/auth/me');
        if (!isAuthCheck) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth:logout'));
          toast.error('Session expired. Please login again.');
        }
      } else if (err.response.status === 403) {
        toast.error('Access denied');
      } else if (err.response.status === 404) {
        toast.error('Resource not found');
      } else if (err.response.status >= 500) {
        toast.error('Server error. Please try again later.');
      }
    } else if (err.request) {
      // Request made but no response (Network error)
      toast.error('Network error. Check your connection.');
    } else {
      // Something else happened
      toast.error('An unexpected error occurred.');
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

export const guardsAPI = {
  getAll: () => api.get('/guards'),
  create: (data) => api.post('/guards', data),
  update: (id, data) => api.put(`/guards/${id}`, data),
  delete: (id) => api.delete(`/guards/${id}`)
};

export const attendanceAPI = {
  checkIn: (data) => api.post('/attendance/checkin', data),
  checkOut: (data) => api.post('/attendance/checkout', data),
  getMyAttendance: (params) => api.get('/attendance/my', { params }),
  getToday: () => api.get('/attendance/today'),
  getAllAttendance: (params) => api.get('/attendance/all', { params }),
  getGuardAttendance: (id, params) => api.get(`/attendance/guard/${id}`, { params })
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getLive: () => api.get('/dashboard/live')
};

export default api;
