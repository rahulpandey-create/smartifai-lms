const config = require('../config/env')
const AppError = require('./AppError')

function enforceAllowedOrigin(req, res, next) {
  const origin = req.get('origin')
  const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(req.method)
  if (isMutation && origin && !config.allowedOrigins.includes(origin)) {
    return next(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'This request origin is not allowed.'))
  }
  return next()
}

module.exports = { enforceAllowedOrigin }
