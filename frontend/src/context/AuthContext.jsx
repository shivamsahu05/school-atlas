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
      localStorage.setItem('sams_last_active', Date.now().toString()) // Reset timer on login
      
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
    localStorage.removeItem('sams_last_active')
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

  // ─── Inactivity Timeout (1 Hour) ───────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const INACTIVITY_LIMIT = 60 * 60 * 1000; // 1 Hour
    const LAST_ACTIVE_KEY = 'sams_last_active';
    const THROTTLE_MS = 10000; // Update storage max once every 10s
    
    // 1. Initial check on mount/login
    const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
    if (lastActive && (Date.now() - lastActive > INACTIVITY_LIMIT)) {
      console.warn('Session expired due to long inactivity.');
      logout();
      return;
    }

    let timeout;
    let lastUpdate = 0;

    const startTimer = () => {
      if (timeout) clearTimeout(timeout);
      // We check if we should logout based on the LATEST value in storage
      // This helps if another tab was active recently
      timeout = setTimeout(() => {
        const currentLastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || '0');
        if (Date.now() - currentLastActive >= INACTIVITY_LIMIT) {
          logout();
          window.location.href = '/login'; 
        } else {
          // Another tab was active! Restart timer with the remaining time
          startTimer();
        }
      }, 30000); // Check every 30s instead of one big timeout
    };

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > THROTTLE_MS) {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        lastUpdate = now;
      }
      startTimer();
    };

    // Listen for storage changes in OTHER tabs
    const handleStorageChange = (e) => {
      if (e.key === LAST_ACTIVE_KEY) {
        startTimer(); // Reset our local check timer because another tab is active
      }
      if (e.key === SESSION_KEY && !e.newValue) {
        logout(); // Another tab logged out
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handleActivity));
    window.addEventListener('storage', handleStorageChange);

    handleActivity(); 

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(e => window.removeEventListener(e, handleActivity));
      window.removeEventListener('storage', handleStorageChange);
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
