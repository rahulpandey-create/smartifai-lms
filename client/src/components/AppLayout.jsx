import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { MAIN_SITE_URL } from "../lib/brand";

function navClass({ isActive }) {
  return `nav-link${isActive ? " nav-link-active" : ""}`;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    const saved =
      localStorage.getItem("smarrtifai-learn-theme") ||
      localStorage.getItem("learn-loop-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("smarrtifai-learn-theme", theme);
  }, [theme]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="app-header">
        <div className="page-container flex min-h-[72px] flex-wrap items-center justify-between gap-3 py-2">
          <Link
            to="/courses"
            className="brand-mark"
            aria-label="SMARRTIFAI Learn home"
          >
            <img
              className="brand-wordmark"
              src="/smarrtifai-wordmark.png"
              alt="SMARRTIFAI — Learning Smartly"
            />
            <span className="brand-product-label">LEARN</span>
          </Link>

          <nav
            className="flex flex-wrap items-center justify-end gap-1 sm:gap-3"
            aria-label="Main navigation"
          >
            <NavLink to="/courses" className={navClass}>
              Courses
            </NavLink>
            {user?.role === "student" && (
              <NavLink to="/dashboard" className={navClass}>
                My learning
              </NavLink>
            )}
            {user?.role === "admin" && (
              <NavLink to="/admin" className={navClass}>
                <ShieldCheck size={15} /> Analytics
              </NavLink>
            )}
            <a
              href={MAIN_SITE_URL}
              className="main-site-link button button-secondary button-small"
              aria-label="Back to SMARRTIFAI main website"
              title="Visit the SMARRTIFAI main website"
            >
              <ArrowLeft size={14} aria-hidden="true" />
              <span>Back to SMARRTIFAI</span>
            </a>
            <button
              className="icon-button theme-toggle"
              onClick={() =>
                setTheme((current) =>
                  current === "dark" ? "light" : "dark"
                )
              }
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-pressed={theme === "dark"}
            >
              {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            {user ? (
              <div className="user-menu">
                <span className="hidden text-sm font-medium text-ink-soft sm:inline">
                  {user.name}
                </span>
                <button
                  className="icon-button"
                  onClick={handleLogout}
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut size={17} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="button button-primary button-small">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="page-container py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-line bg-white/70 py-6">
        <div className="page-container flex flex-col justify-between gap-2 text-xs text-ink-soft sm:flex-row">
          <span>SMARRTIFAI LEARN · Learning & student progress</span>
          <span>
            Learning progress is self-reported and does not prove mastery.
          </span>
        </div>
      </footer>
    </div>
  );
}
