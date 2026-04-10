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
