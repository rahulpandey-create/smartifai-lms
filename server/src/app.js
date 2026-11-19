const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const config = require('./config/env')
const { getDbStatus } = require('./config/db')

const app = express()

// Number of reverse-proxy hops in front of Express (0 locally). Needed for the real client IP.
app.set('trust proxy', config.trustProxy)

app.use(helmet())

// API responses are user-specific, so browsers and proxies must never cache them.
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})

app.use(
  cors({
    // Requests without an Origin header (curl, server-to-server, same-origin) pass through.
    // Browser origins must be on the allow-list; anything else gets no CORS headers and is blocked.
    origin(origin, callback) {
      callback(null, !origin || config.allowedOrigins.includes(origin))
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.get('/api/health', (req, res) => {
  const db = getDbStatus()

  res.status(200).json({
    success: true,
    data: {
      status: db === 'connected' ? 'ok' : 'degraded',
      service: 'learn-loop-api',
      environment: config.nodeEnv,
      db,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  })
})

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  })
})

// Minimal error handler for Checkpoint 1; Checkpoint 2 replaces it with middleware/errorHandler.js.
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err)

  let status = 500
  let code = 'INTERNAL_ERROR'
  let message = 'Something went wrong. Please try again.'

  if (err.type === 'entity.parse.failed') {
    status = 400
    code = 'INVALID_JSON'
    message = 'Request body is not valid JSON.'
  } else if (err.type === 'entity.too.large') {
    status = 413
    code = 'PAYLOAD_TOO_LARGE'
    message = 'Request body is too large.'
  }

  if (status === 500) console.error('[error]', config.isProduction ? err.message : err)

  return res.status(status).json({ success: false, error: { code, message } })
})

module.exports = app