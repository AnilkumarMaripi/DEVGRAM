/**
 * Token Bucket / Sliding Window Rate Limiter Middleware
 * Returns HTTP 429 with Retry-After header when rate limit is exceeded.
 */

class MemoryTokenBucketStore {
  constructor() {
    this.hits = new Map()
    // Periodic garbage collection every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000)
  }

  getRecord(key, windowMs) {
    const now = Date.now()
    let record = this.hits.get(key)
    if (!record || record.resetTime <= now) {
      record = { count: 0, resetTime: now + windowMs }
      this.hits.set(key, record)
    }
    return record
  }

  cleanup() {
    const now = Date.now()
    for (const [key, record] of this.hits.entries()) {
      if (record.resetTime <= now) {
        this.hits.delete(key)
      }
    }
  }
}

const store = new MemoryTokenBucketStore()

export function rateLimiter({
  windowMs = 15 * 60 * 1000,
  max = 10,
  message = 'Too many requests. Please slow down and try again later.',
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
} = {}) {
  return (req, res, next) => {
    const ip = keyGenerator(req)
    const key = `${req.baseUrl || ''}${req.path}:${ip}`

    const record = store.getRecord(key, windowMs)
    record.count += 1

    const now = Date.now()
    const remaining = Math.max(0, max - record.count)
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000)

    res.setHeader('X-RateLimit-Limit', max)
    res.setHeader('X-RateLimit-Remaining', remaining)
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000))

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfterSeconds)
      return res.status(429).json({
        status: 429,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `${message} (Retry after ${retryAfterSeconds}s)`,
        retryAfter: retryAfterSeconds,
      })
    }

    return next()
  }
}

// Pre-configured rate limiters
export const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  message: 'Too many login attempts from this address. Please wait before trying again.',
})

export const registerRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many account registrations attempted from this address.',
})

export const passwordResetRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: 'Too many password reset requests. Please check your email or try again later.',
})

export const emailVerificationRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 5,
  message: 'Too many verification email requests. Please check your inbox or wait before retrying.',
})

export const writeRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: 'You are publishing content too quickly. Please pause for a moment.',
  keyGenerator: (req) => req.userId || req.ip || 'anon',
})

