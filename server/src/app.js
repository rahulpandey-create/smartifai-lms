const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const config = require('./config/env')
const { getDbStatus } = require('./config/db')
const { ensureSession } = require('./middleware/session')
const { enforceAllowedOrigin } = require('./middleware/requestSecurity')
const { notFound, errorHandler } = require('./middleware/errorHandler')

const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const dashboardRoutes = require('./routes/dashboardRoutes')
const lessonRoutes = require('./routes/lessonRoutes')
const eventRoutes = require('./routes/eventRoutes')
const adminRoutes = require('./routes/adminRoutes')

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', config.trustProxy)

app.use(helmet())
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store')
  next()
})
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || config.allowedOrigins.includes(origin))
  },
  credentials: true,
}))
app.use(express.json({ limit: '20kb' }))
app.use(cookieParser())
app.use(ensureSession)
app.use(enforceAllowedOrigin)

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

app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/me/dashboard', dashboardRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
