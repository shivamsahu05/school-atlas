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

      // Step 1: Lean login — only validates credentials, returns basic user + token
      const res = await axios.post(`${API_BASE}/auth/login`, { username, password })
      const { token, user: userData } = res.data.data

      // Step 2: Persist token immediately so refreshUser() can use it
      const session = { token, user: userData }
      localStorage.setItem(SESSION_KEY, JSON.stringify(session))
      localStorage.setItem('token', token)
      localStorage.setItem('sams_last_active', Date.now().toString())
      setUser({ ...userData, token })

      // Step 3: Fetch full profile (permissions, subjects, etc.) from /auth/me
      // This runs in background — login is already marked successful
      try {
        const meRes = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (meRes.data.success) {
          const fullUser = meRes.data.data
          const fullSession = { token, user: fullUser }
          localStorage.setItem(SESSION_KEY, JSON.stringify(fullSession))
          setUser({ ...fullUser, token })
        }
      } catch (meErr) {
        // Non-fatal: user is logged in with basic data, permissions load later
        console.warn('[AUTH] /me enrichment failed after login:', meErr.message)
      }

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

  // ─── Inactivity Timeout (5 Minutes) ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 5 * 60 * 1000; // 5 Minutes
    const LAST_ACTIVE_KEY = 'sams_last_active';
    
    // 1. Initial check on mount/login
    const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
    if (lastActive && (Date.now() - lastActive > INACTIVITY_LIMIT)) {
      console.warn('Session expired due to inactivity across browser sessions.');
      logout();
      return;
    }

    let timeout;
    const startTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
        window.location.href = '/login'; // Force redirect
      }, INACTIVITY_LIMIT);
    };

    const handleActivity = () => {
      localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      startTimer();
    };

    // Listeners for any user interaction
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));

    handleActivity(); // Set initial timestamp and start timer

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [user, logout]);

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
