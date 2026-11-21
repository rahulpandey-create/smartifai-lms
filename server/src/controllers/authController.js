const bcrypt = require('bcrypt')
const crypto = require('node:crypto')
const User = require('../models/User')
const config = require('../config/env')
const AppError = require('../middleware/AppError')
const { issueAuthCookie, clearAuthCookie } = require('../middleware/auth')
const { setSessionCookie } = require('../middleware/session')
const { recordEvent } = require('../services/eventService')

async function signup(req, res) {
  const { name, email, password } = req.body
  const normalizedEmail = email.toLowerCase()
  const existing = await User.findOne({ email: normalizedEmail }).select('_id')
  if (existing) throw new AppError(409, 'EMAIL_IN_USE', 'An account with this email already exists.')

  const passwordHash = await bcrypt.hash(password, config.bcryptSaltRounds)
  const user = await User.create({ name, email: normalizedEmail, passwordHash, role: 'student' })
  const sessionId = req.sessionId || crypto.randomUUID()
  setSessionCookie(res, sessionId)
  issueAuthCookie(res, user, sessionId)
  await recordEvent({
    eventName: 'user-signup', actorId: user._id, sessionId, isDemo: false,
    dedupeKey: `signup:${user._id}`,
  })

  return res.status(201).json({ success: true, data: { user: user.toSafeJSON() } })
}

async function login(req, res) {
  const { email, password } = req.body
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash')
  const valid = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect.')

  const sessionId = req.sessionId || crypto.randomUUID()
  setSessionCookie(res, sessionId)
  issueAuthCookie(res, user, sessionId)
  await recordEvent({ eventName: 'login', actorId: user._id, sessionId, isDemo: user.isDemo })

  return res.status(200).json({ success: true, data: { user: user.toSafeJSON() } })
}

async function logout(req, res) {
  clearAuthCookie(res)
  const anonymousSession = crypto.randomUUID()
  setSessionCookie(res, anonymousSession)
  return res.status(200).json({ success: true, data: { loggedOut: true } })
}

async function me(req, res) {
  return res.json({ success: true, data: { user: req.user.toSafeJSON() } })
}

module.exports = { signup, login, logout, me }
