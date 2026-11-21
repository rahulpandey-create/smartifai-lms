import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

function navClass({ isActive }) {
  return `nav-link${isActive ? ' nav-link-active' : ''}`
}

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="app-header">
        <div className="page-container flex min-h-[72px] items-center justify-between gap-4">
          <Link to="/courses" className="brand-mark" aria-label="LEARN LOOP home">
            <span className="brand-icon"><BookOpen size={21} aria-hidden="true" /></span>
            <span>LEARN <strong>LOOP</strong></span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4" aria-label="Main navigation">
            <NavLink to="/courses" className={navClass}>Courses</NavLink>
            {user?.role === 'student' && <NavLink to="/dashboard" className={navClass}>My learning</NavLink>}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navClass}><ShieldCheck size={15} /> Analytics</NavLink>
            )}
            {user ? (
              <div className="user-menu">
                <span className="hidden text-sm font-medium text-ink-soft sm:inline">{user.name}</span>
                <button className="icon-button" onClick={handleLogout} title="Sign out" aria-label="Sign out">
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="button button-primary button-small">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="page-container py-8 sm:py-10"><Outlet /></main>
      <footer className="border-t border-line bg-white/70 py-6">
        <div className="page-container flex flex-col justify-between gap-2 text-xs text-ink-soft sm:flex-row">
          <span>LEARN LOOP · Learning management & student success insights</span>
          <span>Learning progress is self-reported and does not prove mastery.</span>
        </div>
      </footer>
    </div>
  )
}
