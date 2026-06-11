import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  try {
    const session = localStorage.getItem('sams_session');
    if (session) {
      const { token } = JSON.parse(session);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (err) {
    console.error('Auth interceptor error:', err);
  }
  return config;
});

export const studentApi = {
  getAll: (params) => api.get('/students', { params }),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
  block: (id) => api.put(`/students/${id}/block`),
  unblock: (id) => api.put(`/students/${id}/unblock`),
};

export const classesApi = {
  getAll: (params) => api.get('/classes', { params }),
  getSubjects: (params) => api.get('/subjects', { params }),
};

export const academicApi = {
  getClasses: () => api.get('/admin/classes'),
  getClassSections: (classId) => api.get(`/admin/class-sections/${classId}`),
  getClassSubjects: (classId, params) => api.get(`/admin/class-subjects/${classId}`, { params }),
  getPerformance: () => api.get('/admin/performance'),
  resolveTeacher: (params) => api.get('/admin/resolve-teacher', { params }),
};

export const teacherApi = {
  getAll: (params) => api.get('/teachers', { params }),
  create: (data) => api.post('/teachers', data),
  update: (id, data) => api.put(`/teachers/${id}`, data),
  delete: (id) => api.delete(`/teachers/${id}`),
  toggleStatus: (id) => api.put(`/teachers/${id}/toggle-status`),
};

export const dashboardApi = {
  admin: () => api.get('/dashboard/admin'),
  teacher: () => api.get('/dashboard/teacher'),
};

export const syllabusApi = {
  getAll: (params) => api.get('/syllabus', { params }),
  create: (data) => api.post('/syllabus', data),
  update: (id, data) => api.put(`/syllabus/${id}`, data),
};

export const subjectApi = {
  getAll: (params) => api.get('/admin/subjects', { params }),
  create: (data) => api.post('/admin/subjects', data),
  update: (id, data) => api.put(`/admin/subjects/${id}`, data),
  delete: (id) => api.delete(`/admin/subjects/${id}`),
  assign: (data) => api.post('/admin/subject-assignments', data), // Unified assignment
};

export const leaveApi = {
  getAll: (params) => api.get('/leave', { params }),
  create: (data) => api.post('/leave', data),
  update: (id, data) => api.put(`/leave/${id}`, data),
};

export const eventApi = {
  getAll: (params) => api.get('/events', { params }),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),

  getParticipants: (id) => api.get(`/events/${id}/participants`),
  addParticipant: (id, data) => api.post(`/events/${id}/participants`, data),
  removeParticipant: (pid) => api.delete(`/events/participants/${pid}`),

  getWinners: (id) => api.get(`/events/${id}/winners`),
  setWinner: (id, data) => api.post(`/events/${id}/winners`, data),
  removeWinner: (wid) => api.delete(`/events/winners/${wid}`),
};

export const performanceApi = {
  getAll: () => api.get('/performance/all'),
  getTeacher: (id) => api.get(`/performance/teacher/${id}`),
  saveOverride: (data) => api.post('/performance/override', data),
};

export const teacherLoApi = {
  get: (params) => api.get('/teacher-lo', { params }),
  submitSelf: (data) => api.post('/teacher-lo/self', data),
  awardAdmin: (data) => api.post('/teacher-lo/award', data),
};

export const observationApi = {
  getAll: (params) => api.get('/observations', { params }),
  getOwn: () => api.get('/teacher/observations'),

  create: (data) => api.post('/observations', data),
};

export const systemApi = {
  getStatus: () => api.get('/admin/system/status'),
  resetPermissions: () => api.post('/admin/system/reset-permissions'),
  cleanupData: () => api.post('/admin/system/cleanup'),
  rolloverYear: () => api.post('/admin/system/rollover'),
};

export default api;
