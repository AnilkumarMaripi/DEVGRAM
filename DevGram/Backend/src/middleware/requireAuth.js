import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(request, response, next) {
  let token = request.cookies?.devgram_session

  if (!token && request.headers.authorization && request.headers.authorization.startsWith('Bearer ')) {
    token = request.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return response.status(401).json({ error: 'UNAUTHORIZED', message: 'Not authenticated. Please log in.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    request.user = decoded
    request.userId = decoded.userId

    // Update lastActive timestamp non-blockingly
    if (decoded.userId) {
      User.findByIdAndUpdate(decoded.userId, { lastActive: new Date() }).exec().catch(() => {})
    }

    return next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return response.status(401).json({ error: 'TOKEN_EXPIRED', message: 'Access token expired. Please refresh session.' })
    }
    return response.status(401).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired session token.' })
  }
}

/**
 * Middleware: Enforces that the user has verified their email address before proceeding.
 * Returns 403 Forbidden if user.isVerified is false.
 */
export async function requireVerifiedEmail(request, response, next) {
  if (!request.userId) {
    return response.status(401).json({ error: 'UNAUTHORIZED', message: 'Authentication required' })
  }

  try {
    const user = await User.findById(request.userId).select('isVerified email')
    if (!user) {
      return response.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' })
    }

    if (!user.isVerified) {
      return response.status(403).json({
        error: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required. Please verify your email to create posts, stories, or messages.',
        email: user.email,
      })
    }

    request.verifiedUser = user
    return next()
  } catch (err) {
    console.error('requireVerifiedEmail error:', err)
    return response.status(500).json({ error: 'SERVER_ERROR', message: 'Error checking verification status' })
  }
}
