const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'NETWORK_ERROR', details = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export async function api(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, {
      credentials: 'include',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    })
  } catch (error) {
    throw new ApiError('Unable to reach SMARRTIFAI Learn. Check that the server is running.', { details: error.message })
  }

  let body
  try {
    body = await response.json()
  } catch {
    throw new ApiError('The server returned an unreadable response.', { status: response.status })
  }
  if (!response.ok || body.success === false) {
    throw new ApiError(body.error?.message || `Request failed (${response.status}).`, {
      status: response.status,
      code: body.error?.code,
      details: body.error?.details,
    })
  }
  return body.data
}

export function post(path, payload) {
  return api(path, { method: 'POST', body: JSON.stringify(payload) })
}

export async function recordEvent(event) {
  try {
    await post('/events', {
      ...event,
      eventId: event.eventId || (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`),
    })
  } catch {
    // Analytics is best-effort; navigation and learning actions must remain usable if ingestion fails.
  }
}
