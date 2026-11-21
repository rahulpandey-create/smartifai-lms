import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-react'

export function Loading({ label = 'Loading…' }) {
  return <div className="state-panel" role="status"><LoaderCircle className="animate-spin" size={20} /> {label}</div>
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="state-panel state-error" role="alert">
      <AlertCircle size={20} />
      <div className="min-w-0"><strong>Something went wrong</strong><p>{error?.message || 'Please try again.'}</p></div>
      {onRetry && <button className="button button-secondary button-small" onClick={onRetry}>Retry</button>}
    </div>
  )
}

export function SuccessNotice({ children }) {
  return <div className="notice notice-success" role="status"><CheckCircle2 size={17} /> {children}</div>
}

export function EmptyState({ title, children }) {
  return <div className="empty-state"><div className="empty-icon"><AlertCircle size={20} /></div><h3>{title}</h3><p>{children}</p></div>
}
