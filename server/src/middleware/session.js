const crypto = require('node:crypto')

const config = require('../config/env')

const SESSION_COOKIE = 'll_sid'
const SESSION_TTL_MS = 30 * 60 * 1000
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function setSessionCookie(res, sessionId) {
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

function ensureSession(req, res, next) {
  let sessionId = req.cookies?.[SESSION_COOKIE]
  if (typeof sessionId !== 'string' || !UUID_PATTERN.test(sessionId)) {
    sessionId = crypto.randomUUID()
  }
  req.sessionId = sessionId
  setSessionCookie(res, sessionId)
  next()
}

module.exports = { SESSION_COOKIE, SESSION_TTL_MS, ensureSession, setSessionCookie }
