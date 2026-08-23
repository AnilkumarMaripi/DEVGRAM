import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export function requireAuth(request, response, next) {
  const token = request.cookies.devgram_session

  if (!token) {
    return response.status(401).json({ message: 'Not authenticated' })
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    if (request.user && request.user.userId) {
      User.findByIdAndUpdate(request.user.userId, { lastActive: new Date() }).exec().catch(() => {})
    }
    return next()
  } catch {
    return response.status(401).json({ message: 'Session expired' })
  }
}
