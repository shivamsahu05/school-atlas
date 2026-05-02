// src/api/index.js  –  Central API client for SAMS frontend
import axios from 'axios'

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  try {
    const session = JSON.parse(localStorage.getItem('sams_session') || '{}')
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  } catch {}
  return config
})

// Handle response errors + Retry logic
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config;
    
    // If it's a 401, redirect to login
    if (err.response?.status === 401) {
      localStorage.removeItem('sams_session');
      window.location.href = '/login';
      return Promise.reject(err);
    }

    // Network error / Connection Refused (no response) -> Retry logic
    if (!err.response || err.code === 'ECONNABORTED' || err.message === 'Network Error') {
      config.__retryCount = config.__retryCount || 0;
      
      if (config.__retryCount < 3) {
        config.__retryCount += 1;
        console.warn(`[API] Retrying request (${config.__retryCount}/3)...`);
        // Exponential backoff
        const delay = Math.pow(2, config.__retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return api(config);
      }
    }

    return Promise.reject(err);
  }
)

// ─── Public Axios (no auth, no redirect) ────────────────────────────────────
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// ═════════════════════════════════════════════════════════════════════════════
// CONTACT (public form + admin management)
// ═════════════════════════════════════════════════════════════════════════════
export const contactApi = {
  submit:       (data)           => publicApi.post('/contact', data).then(r => r.data),
  getAll:       (params = {})    => api.get('/contact', { params }).then(r => r.data),
  updateStatus: (id, status)     => api.patch(`/contact/${id}/status`, { status }).then(r => r.data),
  delete:       (id)             => api.delete(`/contact/${id}`).then(r => r.data),
}

// ─── Helper ───────────────────────────────────────────────────────────────────
const unwrap  = (p) => p.then(r => r.data.data)
const unwrapD = (p) => p.then(r => r.data)        // for controllers returning { success, data }

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }).then(r => r.data.data),
  me: () => unwrap(api.get('/auth/me')),
}

// ═════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═════════════════════════════════════════════════════════════════════════════
export const dashboardApi = {
  getAdminMetrics:          () => api.get('/dashboard/admin-metrics').then(r => r.data),
  getTeacherDashboard:      () => api.get('/dashboard/teacher').then(r => r.data),
  getHomeworkNotifications: () => api.get('/dashboard/homework-notifications').then(r => r.data),
  getNotifications:         () => api.get('/dashboard/notifications').then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// USERS (admin only)
// ═════════════════════════════════════════════════════════════════════════════
export const usersApi = {
  getAll:  (params = {}) => unwrap(api.get('/users',      { params })),
  getById: (id)           => unwrap(api.get(`/users/${id}`)),
  create:  (data)         => unwrap(api.post('/users',    data)),
  update:  (id, data)     => unwrap(api.put(`/users/${id}`, data)),
  delete:  (id)           => unwrap(api.delete(`/users/${id}`)),
}

// ═════════════════════════════════════════════════════════════════════════════
// TEACHERS (admin)
// ═════════════════════════════════════════════════════════════════════════════
export const teachersApi = {
  getAll:        (params = {}) => api.get('/teachers',             { params }).then(r => r.data),
  getById:       (id)           => api.get(`/teachers/${id}`).then(r => r.data),
  create:        (data)         => api.post('/teachers',           data).then(r => r.data),
  update:        (id, data)     => api.put(`/teachers/${id}`,      data).then(r => r.data),
  delete:        (id)           => api.delete(`/teachers/${id}`).then(r => r.data),
  updateStatus:  (id, status)   => api.patch(`/teachers/${id}/status`, { status }).then(r => r.data),
  exportExcel:   ()             => api.get('/teachers/export', { responseType:'blob' }),
  bulkUpload:    (form)         => api.post('/teachers/bulk-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// STUDENTS
// ═════════════════════════════════════════════════════════════════════════════
export const studentsApi = {
  getAll:     (params = {}) => api.get('/students',           { params }).then(r => r.data),
  getById:    (id)           => api.get(`/students/${id}`).then(r => r.data),
  create:     (data)         => api.post('/students',         data).then(r => r.data),
  update:     (id, data)     => api.put(`/students/${id}`,    data).then(r => r.data),
  delete:     (id)           => api.delete(`/students/${id}`).then(r => r.data),
  block:      (id)           => api.put(`/students/${id}/block`).then(r => r.data),
  unblock:    (id)           => api.put(`/students/${id}/unblock`).then(r => r.data),
  bulkUpload: (form)         => api.post('/students/bulk-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data),
  downloadTemplate: () => api.get('/students/template-download', { responseType: 'blob' }).then(res => {
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Student_Upload_Template.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
  }),
}

// ═════════════════════════════════════════════════════════════════════════════
// CLASSES & SUBJECTS (public reference data)
// ═════════════════════════════════════════════════════════════════════════════
export const classesApi = {
  getAll:     (params = {}) => api.get('/classes',   { params }).then(r => r.data),
  getSubjects:(params = {}) => api.get('/subjects',  { params }).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// ACADEMIC (admin — classes / sections / subjects / streams)
// ═════════════════════════════════════════════════════════════════════════════
export const academicApi = {
  // Classes
  getClasses:      ()           => api.get('/admin/classes').then(r => r.data),
  createClass:     (data)       => api.post('/admin/classes', data).then(r => r.data),
  updateClass:     (id, data)   => api.put(`/admin/classes/${id}`, data).then(r => r.data),
  deleteClass:     (id)         => api.delete(`/admin/classes/${id}`).then(r => r.data),
  // Sections
  getSections:     ()           => api.get('/admin/sections').then(r => r.data),
  createSection:   (data)       => api.post('/admin/sections', data).then(r => r.data),
  // Subjects (admin managed)
  getSubjects:     ()           => api.get('/admin/subjects').then(r => r.data),
  createSubject:   (data)       => api.post('/admin/subjects', data).then(r => r.data),
  updateSubject:   (id, data)   => api.put(`/admin/subjects/${id}`, data).then(r => r.data),
  deleteSubject:   (id)         => api.delete(`/admin/subjects/${id}`).then(r => r.data),
  // Subject Assignments
  assignSubject:   (data)       => api.post('/admin/subject-assignments', data).then(r => r.data),
  // Class sections assignments
  getClassSections:(classId)    => api.get(`/admin/class-sections/${classId}`).then(r => r.data),
  getClassSubjects:(classId)    => api.get(`/admin/class-subjects/${classId}`).then(r => r.data),
  getFollowUps:    (params = {}) => api.get('/admin/followups', { params }).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// SYLLABUS
// ═════════════════════════════════════════════════════════════════════════════
export const syllabusApi = {
  getAll:   (params = {}) => api.get('/syllabus',          { params }).then(r => r.data),
  getMetadata: (params = {}) => api.get('/syllabus/metadata', { params }).then(r => r.data),
  create:   (data)         => api.post('/syllabus',         data).then(r => r.data),
  update:   (id, data)     => api.put(`/syllabus/${id}`,    data).then(r => r.data),
  delete:   (id)           => api.delete(`/syllabus/${id}`).then(r => r.data),
  markDone: (id)           => api.put(`/syllabus/${id}`, { is_completed: true }).then(r => r.data),
  downloadTemplate: ()     => api.get('/syllabus/template', { responseType: 'blob' }),
  bulkUpload: (formData)   => api.post('/syllabus/bulk-upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// HOMEWORK
// ═════════════════════════════════════════════════════════════════════════════
export const homeworkApi = {
  getAll:         (params = {}) => api.get('/homework',                  { params }).then(r => r.data),
  getById:        (id)           => api.get(`/homework/${id}`).then(r => r.data),
  create:         (data)         => api.post('/homework',                data).then(r => r.data),
  update:         (id, data)     => api.put(`/homework/${id}`,           data).then(r => r.data),
  delete:         (id)           => api.delete(`/homework/${id}`).then(r => r.data),
  // Submissions
  getSubmissions: (hwId, params = {}) =>
    api.get(`/homework/${hwId}/submissions`, { params }).then(r => r.data),
  submitMarks:    (hwId, data)   =>
    api.post(`/homework/${hwId}/submissions`, data).then(r => r.data),
  updateSubmission:(hwId, stuId, data) =>
    api.put(`/homework/${hwId}/submissions/${stuId}`, data).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// LEARNING OUTCOMES (teacher entries)
// ═════════════════════════════════════════════════════════════════════════════
export const loApi = {
  getAll:    (params = {}) => api.get('/teacher-lo',           { params }).then(r => r.data),
  getById:   (id)           => api.get(`/teacher-lo/${id}`).then(r => r.data),
  create:    (data)         => api.post('/teacher-lo/self',     data).then(r => r.data),
  update:    (id, data)     => api.put(`/teacher-lo/${id}`,     data).then(r => r.data),
  delete:    (id)           => api.delete(`/teacher-lo/${id}`).then(r => r.data),
  getSummary:(params = {})  => api.get('/teacher-lo/summary',  { params }).then(r => r.data),
  getAssignments: ()        => api.get('/teacher-lo/assignments').then(r => r.data),
  getTopics: (cId, sId)     => api.get('/teacher-lo/topics', { params: { class_id: cId, subject_id: sId } }).then(r => r.data),
}

// Admin LO (award principal scores)
export const adminLoApi = {
  getEntries:  (params = {}) => api.get('/admin/lo',            { params }).then(r => r.data),
  getMeta:     ()             => api.get('/admin/lo/meta').then(r => r.data),
  awardScore:  (id, data)    => api.put(`/admin/lo/${id}/score`, data).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// OBSERVATIONS (principal)
// ═════════════════════════════════════════════════════════════════════════════
export const observationsApi = {
  getAll:  (params = {}) => api.get('/observations',          { params }).then(r => r.data),
  getOwn:  ()             => api.get('/observations/teacher-own').then(r => r.data),
  getById: (id)           => api.get(`/observations/${id}`).then(r => r.data),
  create:  (data)         => api.post('/observations',         data).then(r => r.data),
  update:  (id, data)     => api.put(`/observations/${id}`,    data).then(r => r.data),
  delete:  (id)           => api.delete(`/observations/${id}`).then(r => r.data),
}


// ═════════════════════════════════════════════════════════════════════════════
// PERFORMANCE (admin only)
// ═════════════════════════════════════════════════════════════════════════════
export const performanceApi = {
  getAll:     ()          => api.get('/performance/all').then(r => r.data),
  getMe:      ()          => api.get('/performance/me').then(r => r.data),
  getById:    (teacherId) => api.get(`/performance/${teacherId}`).then(r => r.data),
  recalculate:(teacherId) => api.post(`/performance/${teacherId}/recalculate`).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// REPORTS (admin)
// ═════════════════════════════════════════════════════════════════════════════
export const reportsApi = {
  getCompletionReport: (params = {}) => api.get('/admin/completion-report', { params }).then(r => r.data),
  exportCompletionReport: (params = {}) => api.get('/admin/completion-report/export', { params, responseType: 'blob' }),
}

// ═════════════════════════════════════════════════════════════════════════════
// LEAVE
// ═════════════════════════════════════════════════════════════════════════════
export const leaveApi = {
  getAll:       (params = {}) => api.get('/leave',             { params }).then(r => r.data),
  getById:      (id)           => api.get(`/leave/${id}`).then(r => r.data),
  create:       (data)         => api.post('/leave',            data).then(r => r.data),
  updateStatus: (id, status)   => api.put(`/leave/${id}`, { status }).then(r => r.data),
  delete:       (id)           => api.delete(`/leave/${id}`).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// MICRO SCHEDULE (teacher)
// ═════════════════════════════════════════════════════════════════════════════
export const scheduleApi = {
  getMySchedule:    (params = {}) => api.get('/teacher/schedule', { params }).then(r => r.data),
  getMyAssignments: ()            => api.get('/teacher/schedule/assignments').then(r => r.data),
  markComplete:     (data)        => api.post('/teacher/schedule/update', data).then(r => r.data),
  getMicroSchedule: (params = {}) => api.get('/teacher/schedule/micro-schedule', { params }).then(r => r.data),
  saveMicroSchedule:(data)        => api.post('/teacher/schedule/micro-schedule', data).then(r => r.data),
  getTeacherSubjects: (params = {}) => api.get('/teacher/schedule/subjects', { params }).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// PERMISSIONS (admin)
// ═════════════════════════════════════════════════════════════════════════════
export const permissionsApi = {
  getMeta:    () => api.get('/admin/permissions/meta').then(r => r.data),
  getActive:  () => api.get('/admin/permissions/active').then(r => r.data),
  getExpired: () => api.get('/admin/permissions/expired').then(r => r.data),
  grant:      (data)     => api.post('/admin/permissions/grant', data).then(r => r.data),
  update:     (id, data) => api.put(`/admin/permissions/${id}`,  data).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENTS (admin)
// ═════════════════════════════════════════════════════════════════════════════
export const eventsApi = {
  getAll:    (params = {}) => api.get('/events',           { params }).then(r => r.data),
  getById:   (id)           => api.get(`/events/${id}`).then(r => r.data),
  create:    (data)         => api.post('/events',          data).then(r => r.data),
  update:    (id, data)     => api.put(`/events/${id}`,     data).then(r => r.data),
  delete:    (id)           => api.delete(`/events/${id}`).then(r => r.data),
  // Participants
  addParticipant:  (eventId, data) =>
    api.post(`/events/${eventId}/participants`, data).then(r => r.data),
  recordWinner:    (eventId, data) =>
    api.post(`/events/${eventId}/winners`, data).then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// LMS INTELLIGENCE
// ═════════════════════════════════════════════════════════════════════════════
export const intelligenceApi = {
  getTeacherDashboard: () => api.get('/lms/intelligence/teacher-dashboard').then(r => r.data),
  getAdminDashboard:   () => api.get('/lms/intelligence/admin-dashboard').then(r => r.data),
  getMicroIntelligence:() => api.get('/lms/intelligence/micro-intelligence').then(r => r.data),
  getLOIntelligence:   () => api.get('/lms/intelligence/lo-intelligence').then(r => r.data),
  getAnalytics:        () => api.get('/lms/intelligence/analytics').then(r => r.data),
  getNotifications:    () => api.get('/lms/intelligence/notifications').then(r => r.data),
  triggerEngine:       () => api.post('/lms/intelligence/run-engine').then(r => r.data),
}

// ═════════════════════════════════════════════════════════════════════════════
// PROFILE (teacher – view/update own profile)
// ═════════════════════════════════════════════════════════════════════════════
export const profileApi = {
  getMe:   ()       => unwrap(api.get('/teacher/profile')),
  update:  (data)   => unwrapD(api.put('/teacher/profile', data)),
}

export default api
