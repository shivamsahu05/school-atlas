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
  login: (email, password) =>
    api.post('/auth/login', { email, password }).then((r) => r.data.data),
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
// DATA MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
export const usersApi = {
  getAll:  (params = {}) => unwrap(api.get('/users',    { params })),
  getById: (id)          => unwrap(api.get(`/users/${id}`)),
  create:  (data)        => unwrap(api.post('/users',   data)),
  update:  (id, data)    => unwrap(api.put(`/users/${id}`, data)),
  delete:  (id)          => unwrap(api.delete(`/users/${id}`)),
}

export const studentsApi = {
  getAll:  (params = {}) => unwrap(api.get('/students',    { params })),
  getById: (id)          => unwrap(api.get(`/students/${id}`)),
  create:  (data)        => unwrap(api.post('/students',   data)),
  update:  (id, data)    => unwrap(api.put(`/students/${id}`, data)),
  delete:  (id)          => unwrap(api.delete(`/students/${id}`)),
}

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
}

export default api
