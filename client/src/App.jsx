import { useEffect, useState } from 'react'
import { Repeat } from 'lucide-react'

// Temporary Checkpoint 1 smoke test: confirms React, the Tailwind theme and the /api proxy work.
// Replaced by the real router and layouts in Checkpoint 5.
export default function App() {
  const [status, setStatus] = useState({ state: 'loading' })

  useEffect(() => {
    const controller = new AbortController()

    async function checkApi() {
      try {
        const response = await fetch('/api/health', { signal: controller.signal })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const body = await response.json()
        setStatus({ state: 'ready', health: body.data })
      } catch (error) {
        if (error.name === 'AbortError') return
        setStatus({ state: 'error', message: error.message })
      }
    }

    checkApi()
    return () => controller.abort()
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 px-6">
      <header className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-card">
          <Repeat className="size-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-600">
          LEARN <span className="text-accent-600">LOOP</span>
        </h1>
      </header>

      <section className="rounded-card border border-line bg-surface p-6 shadow-card">
        <h2 className="text-lg font-semibold">Foundation check</h2>
        <p className="mt-1 text-sm text-ink-soft">React, Tailwind theme and the API proxy.</p>

        <div className="mt-4 text-sm" role="status">
          {status.state === 'loading' && <p className="text-ink-soft">Contacting API…</p>}

          {status.state === 'error' && (
            <p className="font-medium text-accent-600">
              API unreachable ({status.message}). Is the server running?
            </p>
          )}

          {status.state === 'ready' && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
              <dt className="text-ink-soft">API</dt>
              <dd className="font-medium">{status.health.status}</dd>
              <dt className="text-ink-soft">Database</dt>
              <dd className="font-medium">{status.health.db}</dd>
              <dt className="text-ink-soft">Environment</dt>
              <dd className="font-medium">{status.health.environment}</dd>
            </dl>
          )}
        </div>
      </section>
    </main>
  )
}