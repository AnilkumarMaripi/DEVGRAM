import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const token = request.cookies.devgram_session

  if (!token) {
    return response.status(401).json({ message: 'Not authenticated' })
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return response.status(401).json({ message: 'Session expired' })
  }
}
