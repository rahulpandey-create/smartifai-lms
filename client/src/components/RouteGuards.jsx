import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="state-panel" role="status">Checking your session…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}

export function AuthRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="state-panel" role="status">Checking your session…</div>
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}
