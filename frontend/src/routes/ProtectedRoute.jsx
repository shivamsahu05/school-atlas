import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Redirect unauthenticated users to /login */
export function ProtectedRoute() {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />
}

/** Redirect wrong-role users to their own dashboard */
export function RoleRoute({ role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/teacher'} replace />
  }
  return <Outlet />
}

/** Redirect if user lacks specific module permission */
export function ModuleRoute({ module }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  
  // Admins have bypass
  if (user.role === 'admin') return <Outlet />
  
  const hasAccess = user.permissions?.some(p => {
    const modName = (typeof p === 'string' ? p : (p.module || '')).toLowerCase().replace(/\s+/g, '_');
    const targetModule = (module || '').toLowerCase().replace(/\s+/g, '_');
    
    if (modName === 'all_academic' || modName === 'all_full') return true;
    if (modName !== targetModule) return false;
    
    if (typeof p === 'object' && p.expiresAt) {
      const expiry = new Date(p.expiresAt);
      expiry.setHours(23, 59, 59, 999);
      if (new Date() > expiry) return false;
    }
    return true;
  })
  if (!hasAccess) {
    return <Navigate to="/teacher" replace />
  }
  return <Outlet />
}
