import axios from 'axios';

/**
 * Centered API Configuration for SAMS Backend (PHP/MySQL)
 */
const API_BASE_URL = 'http://localhost:5000/api';  // SAMS Backend


const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Student Service
export const studentService = {
  getAll: () => api.get('/students.php'),
  getById: (id) => api.get(`/students.php?id=${id}`),
  create: (data) => api.post('/students.php', data),
  update: (data) => api.post('/students.php', data),
  delete: (id) => api.delete(`/students.php?id=${id}`),
};

// Teacher Service
export const teacherService = {
  getAll: () => api.get('/teachers.php'),
  create: (data) => api.post('/teachers.php', data),
  update: (data) => api.post('/teachers.php', data),
  toggleStatus: (id) => api.post('/teachers.php', { action: 'toggle_status', id }),
};

// Leave Service
export const leaveService = {
  getAll: () => api.get('/leave.php'),
  updateStatus: (id, status) => api.post('/leave.php', { id, status }),
};

export default api;
