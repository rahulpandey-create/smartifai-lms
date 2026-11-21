const jwt = require('jsonwebtoken')
const User = require('../models/User')
const config = require('../config/env')
const AppError = require('./AppError')

const AUTH_COOKIE = 'll_token'

function issueAuthCookie(res, user, sessionId) {
  const token = jwt.sign(
    { role: user.role, sid: sessionId },
    config.jwt.secret,
    { subject: user._id.toString(), expiresIn: config.jwt.expiresIn },
  )
  const expiresAt = jwt.decode(token).exp * 1000
  const maxAge = Math.max(0, expiresAt - Date.now())
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge,
    path: '/',
  })
}

async function authenticateRequest(req, { optional = false } = {}) {
  const bearer = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null
  const token = req.cookies?.[AUTH_COOKIE] || bearer
  if (!token) {
    if (optional) return null
    throw new AppError(401, 'AUTH_REQUIRED', 'Please sign in to continue.')
  }

  let payload
  try {
    payload = jwt.verify(token, config.jwt.secret)
  } catch (error) {
    if (optional) return null
    throw error
  }
  const user = await User.findById(payload.sub)
  if (!user) {
    if (optional) return null
    throw new AppError(401, 'AUTH_REQUIRED', 'This account is no longer available.')
  }
  req.user = user
  req.sessionId = payload.sid || req.sessionId
  return user
}

async function requireAuth(req, res, next) {
  try {
    await authenticateRequest(req)
    next()
  } catch (error) {
    next(error)
  }
}

async function optionalAuth(req, res, next) {
  try {
    await authenticateRequest(req, { optional: true })
    next()
  } catch (error) {
    next(error)
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError(403, 'FORBIDDEN', 'You do not have permission to access this resource.'))
    }
    return next()
  }
}

function clearAuthCookie(res) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/',
  })
}

module.exports = { AUTH_COOKIE, issueAuthCookie, requireAuth, optionalAuth, requireRole, clearAuthCookie }
