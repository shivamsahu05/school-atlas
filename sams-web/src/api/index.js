import axios from 'axios'

// ─── Axios instance ────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem('sams_session') || '{}')
  if (session?.token) config.headers.Authorization = `Bearer ${session.token}`
  return config
})

// Handle 401 globally – clear session and redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sams_session')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Helper ───────────────────────────────────────────────────────────────────
const unwrap = (promise) => promise.then((r) => r.data.data)

// ─────────────────────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────────────────────
export const authApi = {
<<<<<<< HEAD
  /**
   * Login and return { token, user }.
   * Saves token to localStorage automatically via the updated AuthContext.
   */
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),

=======
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
  me: () => unwrap(api.get('/auth/me')),
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
export const dashboardApi = {
  teacher: () => unwrap(api.get('/dashboard/teacher')),
  admin:   () => unwrap(api.get('/dashboard/admin')),
}

// ─────────────────────────────────────────────────────────────────────────────
<<<<<<< HEAD
// USERS (admin only)
=======
// DATA MANAGEMENT
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
// ─────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:  (params = {}) => unwrap(api.get('/users',    { params })),
  getById: (id)          => unwrap(api.get(`/users/${id}`)),
  create:  (data)        => unwrap(api.post('/users',   data)),
  update:  (id, data)    => unwrap(api.put(`/users/${id}`, data)),
  delete:  (id)          => unwrap(api.delete(`/users/${id}`)),
}

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────────────────────
=======
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
export const studentsApi = {
  getAll:  (params = {}) => unwrap(api.get('/students',    { params })),
  getById: (id)          => unwrap(api.get(`/students/${id}`)),
  create:  (data)        => unwrap(api.post('/students',   data)),
  update:  (id, data)    => unwrap(api.put(`/students/${id}`, data)),
  delete:  (id)          => unwrap(api.delete(`/students/${id}`)),
}

<<<<<<< HEAD
// ─────────────────────────────────────────────────────────────────────────────
// CLASSES & SUBJECTS
// ─────────────────────────────────────────────────────────────────────────────
export const classesApi = {
  getAll: ()          => unwrap(api.get('/classes')),
  create: (data)      => unwrap(api.post('/classes', data)),
  update: (id, data)  => unwrap(api.put(`/classes/${id}`, data)),
  delete: (id)        => unwrap(api.delete(`/classes/${id}`)),
}
export const subjectsApi = {
  getAll: ()          => unwrap(api.get('/subjects')),
  create: (data)      => unwrap(api.post('/subjects', data)),
  update: (id, data)  => unwrap(api.put(`/subjects/${id}`, data)),
  delete: (id)        => unwrap(api.delete(`/subjects/${id}`)),
}
export const classSubjectsApi = {
  getAll:     (params = {}) => unwrap(api.get('/class-subjects', { params })),
  assign:     (data)        => unwrap(api.post('/class-subjects', data)),
  bulkAssign: (data)        => unwrap(api.put('/class-subjects/bulk', data)),
  remove:     (id)          => unwrap(api.delete(`/class-subjects/${id}`)),
}

// ─────────────────────────────────────────────────────────────────────────────
// SYLLABUS
// ─────────────────────────────────────────────────────────────────────────────
export const syllabusApi = {
  getAll:   (params = {}) => unwrap(api.get('/syllabus',    { params })),
  getById:  (id)          => unwrap(api.get(`/syllabus/${id}`)),
  create:   (data)        => unwrap(api.post('/syllabus',   data)),
  update:   (id, data)    => unwrap(api.put(`/syllabus/${id}`, data)),
  // convenience: mark a topic complete
  complete: (id)          => unwrap(api.put(`/syllabus/${id}`, { is_completed: true })),
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEWORK
// ─────────────────────────────────────────────────────────────────────────────
export const homeworkApi = {
  getAll:         (params = {}) => unwrap(api.get('/homework',               { params })),
  getById:        (id)          => unwrap(api.get(`/homework/${id}`)),
  getSubmissions: (id)          => unwrap(api.get(`/homework/${id}/submissions`)),
  create:         (data)        => unwrap(api.post('/homework',              data)),
  submit:         (id, data)    => unwrap(api.post(`/homework/${id}/submit`, data)),
  updateSub:      (id, data)    => unwrap(api.put(`/homework/submission/${id}`, data)),
}

// ─────────────────────────────────────────────────────────────────────────────
// LEARNING OUTCOMES
// ─────────────────────────────────────────────────────────────────────────────
export const loApi = {
  getAll:  (params = {}) => unwrap(api.get('/lo',        { params })),
  create:  (data)        => unwrap(api.post('/lo',        data)),
  update:  (id, data)    => unwrap(api.put(`/lo/${id}`,   data)),
}

// ─────────────────────────────────────────────────────────────────────────────
// OBSERVATIONS
// ─────────────────────────────────────────────────────────────────────────────
export const observationsApi = {
  getAll:  (params = {}) => unwrap(api.get('/observations',   { params })),
  create:  (data)        => unwrap(api.post('/observations',   data)),
}

// ─────────────────────────────────────────────────────────────────────────────
// PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────────
export const performanceApi = {
  all:       ()   => unwrap(api.get('/performance/all')),
  byTeacher: (id) => unwrap(api.get(`/performance/teacher/${id}`)),
}

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────────────────────────────────────
export const leaveApi = {
  getAll:  (params = {}) => unwrap(api.get('/leave',          { params })),
  getById: (id)          => unwrap(api.get(`/leave/${id}`)),
  apply:   (data)        => unwrap(api.post('/leave',          data)),
  update:  (id, status)  => unwrap(api.put(`/leave/${id}`,    { status })),
=======
export const classesApi  = { getAll: () => unwrap(api.get('/classes'))  }
export const subjectsApi = { getAll: () => unwrap(api.get('/subjects')) }

export const syllabusApi = {
  getAll:   (params = {}) => unwrap(api.get('/syllabus',    { params })),
  update:   (id, data)    => unwrap(api.put(`/syllabus/${id}`, data)),
}

export const homeworkApi = {
  getAll:         (params = {}) => unwrap(api.get('/homework',               { params })),
  getById:        (id)          => unwrap(api.get(`/homework/${id}`)),
  create:         (data)        => unwrap(api.post('/homework',              data)),
}

export const loApi = {
  getAll:  (params = {}) => unwrap(api.get('/lo', { params })),
>>>>>>> b1b479845e53524359717104ab47c7124a6cfd6d
}

export default api
