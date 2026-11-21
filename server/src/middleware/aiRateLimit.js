const AppError = require('./AppError')

const WINDOW_MS = 60 * 60 * 1000
const MAX_REQUESTS = 5
const requestsByUser = new Map()

function aiRateLimit(req, res, next) {
  const now = Date.now()
  const key = req.user._id.toString()
  let entry = requestsByUser.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + WINDOW_MS }
  }
  if (entry.count >= MAX_REQUESTS) {
    res.set('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)))
    return next(new AppError(429, 'AI_RATE_LIMITED', 'You have reached the lesson-summary limit. Try again later.'))
  }
  entry.count += 1
  requestsByUser.set(key, entry)

  if (requestsByUser.size > 1000) {
    for (const [userId, value] of requestsByUser) {
      if (value.resetAt <= now) requestsByUser.delete(userId)
    }
  }
  return next()
}

module.exports = aiRateLimit
