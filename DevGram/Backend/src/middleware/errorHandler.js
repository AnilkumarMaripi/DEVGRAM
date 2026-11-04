/**
 * Global Error Handler implementing RFC 7807 Problem Details format
 * (Equivalent to Spring @ControllerAdvice returning ProblemDetail)
 */

export function notFoundHandler(req, res) {
  return res.status(404).json({
    type: 'https://devgram.io/errors/not-found',
    title: 'Resource Not Found',
    status: 404,
    detail: `Cannot ${req.method} ${req.originalUrl}`,
    instance: req.originalUrl,
    timestamp: new Date().toISOString(),
  })
}

export function globalErrorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500
  const isProd = process.env.NODE_ENV === 'production'

  console.error(`💥 [ERROR ${status}] ${req.method} ${req.originalUrl}:`, err.message || err)
  if (err.stack && !isProd) {
    console.error(err.stack)
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      type: 'https://devgram.io/errors/unauthorized',
      title: 'Authentication Error',
      status: 401,
      detail: err.message,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    })
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      type: 'https://devgram.io/errors/bad-request',
      title: 'Invalid Parameter Format',
      status: 400,
      detail: `Invalid format for field: ${err.path}`,
      instance: req.originalUrl,
      timestamp: new Date().toISOString(),
    })
  }

  // Format RFC 7807 Problem Details response
  return res.status(status).json({
    type: err.type || `https://devgram.io/errors/${status >= 500 ? 'internal-error' : 'request-error'}`,
    title: err.title || (status === 500 ? 'Internal Server Error' : err.name || 'Error'),
    status: status,
    detail: isProd && status === 500 ? 'An unexpected error occurred. Please try again later.' : (err.message || 'Unknown error'),
    instance: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(err.fieldErrors ? { fieldErrors: err.fieldErrors } : {}),
  })
}

