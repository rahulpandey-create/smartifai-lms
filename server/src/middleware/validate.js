const AppError = require('./AppError')

function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body)
      if (schemas.params) req.params = schemas.params.parse(req.params)
      if (schemas.query) req.validatedQuery = schemas.query.parse(req.query)
      next()
    } catch (error) {
      if (error.name === 'ZodError') {
        return next(new AppError(400, 'VALIDATION_ERROR', 'Request validation failed.',
          error.issues.map((issue) => ({ path: issue.path, message: issue.message }))))
      }
      return next(error)
    }
  }
}

module.exports = validate
