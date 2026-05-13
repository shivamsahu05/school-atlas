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
    if (p.module !== module) return false;
    if (!p.expiresAt) return true;
    const expiry = new Date(p.expiresAt);
    expiry.setHours(23, 59, 59, 999);
    return new Date() <= expiry;
  })
  if (!hasAccess) {
    return <Navigate to="/teacher" replace />
  }
  return <Outlet />
}
