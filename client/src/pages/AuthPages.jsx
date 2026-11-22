import { useState } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MAIN_SITE_URL } from '../lib/brand'

function AuthFrame({ title, subtitle, children, footer }) {
  return (
    <div className="auth-frame mx-auto grid min-h-[68vh] max-w-5xl overflow-hidden rounded-3xl border border-line bg-white shadow-card md:grid-cols-[0.9fr_1.1fr]">
      <section className="auth-art" aria-label="About SMARRTIFAI Learn">
        <span className="auth-art-orb" aria-hidden="true" />
        <div className="relative z-10">
          <a
            className="auth-brand-lockup"
            href={MAIN_SITE_URL}
            aria-label="Visit the SMARRTIFAI main website"
          >
            <img
              src="/smarrtifai-wordmark.png"
              alt="SMARRTIFAI — Learning Smartly"
            />
            <span>LEARN</span>
          </a>
          <p className="auth-overline mt-8 text-sm font-semibold uppercase tracking-[0.16em]">
            THE SMARRTIFAI LEARNING SPACE
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight">
            Learn smarter.<br />Move forward.
          </h2>
          <p className="mt-4 max-w-xs text-sm leading-6 text-orange-50/95">
            Explore structured courses, build practical skills, and keep your
            learning progress in view.
          </p>
        </div>
        <div className="relative z-10 mt-8 flex items-center gap-2 text-xs text-orange-50">
          <LockKeyhole size={14} /> Secure sign-in · Your learning stays yours
        </div>
      </section>

      <section className="auth-form-panel flex flex-col justify-center p-6 sm:p-10">
        <div>
          <div className="section-kicker">SMARRTIFAI LEARN</div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
        </div>
        {children}
        <div className="mt-7 border-t border-line pt-5 text-sm text-ink-soft">
          {footer}
        </div>
        <a className="auth-main-site-link mt-5" href={MAIN_SITE_URL}>
          Visit the SMARRTIFAI website <ArrowRight size={14} />
        </a>
      </section>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const user = await login(form)
      const destination = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/dashboard')
      navigate(destination, { replace: true })
    } catch (err) { setError(err.message) } finally { setBusy(false) }
  }

  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Sign in to continue where you left off."
      footer={<>New to SMARRTIFAI Learn? <Link className="font-semibold text-brand-700" to="/signup">Create an account</Link></>}
    >
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <label className="field-label">Email address<input className="field-input" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="field-label">Password<input className="field-input" type="password" autoComplete="current-password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
      </form>
    </AuthFrame>
  )
}

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try { await signup(form); navigate('/dashboard', { replace: true }) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }

  return (
    <AuthFrame
      title="Create your account"
      subtitle="Sign up as a student and start learning."
      footer={<>Already have an account? <Link className="font-semibold text-brand-700" to="/login">Sign in</Link></>}
    >
      <form className="mt-8 space-y-4" onSubmit={submit}>
        <label className="field-label">Full name<input className="field-input" type="text" autoComplete="name" minLength={2} maxLength={80} required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="field-label">Email address<input className="field-input" type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="field-label">Password<input className="field-input" type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><span className="mt-1 block text-xs font-normal text-ink-soft">Use at least 8 characters.</span></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <p className="text-xs leading-5 text-ink-soft">For this assessment, use fictional/demo details only. SMARRTIFAI Learn records learning progress and pseudonymous navigation events for its dashboard.</p>
        <button className="button button-primary w-full" disabled={busy}>{busy ? 'Creating account…' : 'Create student account'} <ArrowRight size={17} /></button>
      </form>
    </AuthFrame>
  )
}
