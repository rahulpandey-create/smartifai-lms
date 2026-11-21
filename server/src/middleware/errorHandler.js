const AppError = require('./AppError')
const config = require('../config/env')

function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  })
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  let statusCode = err.statusCode || 500
  let code = err.code || 'INTERNAL_ERROR'
  let message = err.message || 'Something went wrong. Please try again.'

  if (err.name === 'ZodError') {
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Request validation failed.'
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400
    code = 'INVALID_JSON'
    message = 'Request body is not valid JSON.'
  } else if (err.type === 'entity.too.large') {
    statusCode = 413
    code = 'PAYLOAD_TOO_LARGE'
    message = 'Request body is too large.'
  } else if (err.code === 11000) {
    statusCode = 409
    code = 'DUPLICATE_RESOURCE'
    message = 'This record already exists.'
  } else if (err.name === 'CastError') {
    statusCode = 400
    code = 'INVALID_IDENTIFIER'
    message = 'The supplied resource identifier is invalid.'
  } else if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    statusCode = 401
    code = 'INVALID_SESSION'
    message = 'Your session is invalid or has expired. Please sign in again.'
  } else if (!(err instanceof AppError)) {
    statusCode = 500
    code = 'INTERNAL_ERROR'
    message = 'Something went wrong. Please try again.'
  }

  if (statusCode >= 500) console.error('[api:error]', config.isProduction ? err.message : err)

  const payload = { success: false, error: { code, message } }
  if (err.details && statusCode < 500) payload.error.details = err.details
  if (err.name === 'ZodError' && !config.isProduction) {
    payload.error.details = err.issues.map((issue) => ({ path: issue.path, message: issue.message }))
  }
  return res.status(statusCode).json(payload)
}

module.exports = { notFound, errorHandler }
