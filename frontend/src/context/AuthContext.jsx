import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

const SESSION_KEY = 'sams_session'
const API_BASE    = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function loadSession() {
  try {
    const s = localStorage.getItem(SESSION_KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const s = loadSession()
    return s ? { ...s.user, token: s.token } : null
  })
  const [syncing, setSyncing] = useState(true)

  const login = useCallback(async (username, password) => {
    try {
      setSyncing(true)
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password })
      const { token, user: userData } = res.data.data

      const session = { token, user: userData }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      localStorage.setItem('token', token)
      
      setUser({ ...userData, token })
      setSyncing(false)
      return { ok: true, role: userData.role }

    } catch (err) {
      setSyncing(false)
      const msg = err.response?.data?.message || 'Login failed. Check your credentials.'
      return { ok: false, error: msg }
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('token')
    setUser(null)
    setSyncing(false)
  }, [])


  const getToken = useCallback(() => {
    const s = loadSession()
    return s?.token ?? null
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setSyncing(false)
      return
    }
    try {
      setSyncing(true)
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.data.success) {
        const userData = res.data.data
        const session = { token, user: userData }
        localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        setUser({ ...userData, token })
      }
    } catch (err) {
      console.error('AUTH CONTEXT: Sync failed', err)
    } finally {
      setSyncing(false)
    }
  }, [getToken])

  // Auto-sync on mount
  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user, getToken, refreshUser, syncing }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
