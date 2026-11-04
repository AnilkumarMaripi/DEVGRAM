import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { firebaseAdmin } from '../config/firebaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'
import User from '../models/User.js'
import Connection from '../models/Connection.js'
import FollowRequest from '../models/FollowRequest.js'
import CodelensGallery from '../models/CodelensGallery.js'
import Notification from '../models/Notification.js'
import Post from '../models/Post.js'
import Story from '../models/Story.js'
import Message from '../models/Message.js'
import RefreshToken from '../models/RefreshToken.js'
import PasswordResetToken from '../models/PasswordResetToken.js'
import EmailVerificationToken from '../models/EmailVerificationToken.js'
import {
  createAndSetTokens,
  revokeRefreshToken,
  createPasswordResetToken,
  createEmailVerificationToken,
  hashToken,
} from '../services/tokenService.js'
import { sendPasswordResetEmail, sendVerificationEmail } from '../services/mailService.js'
import { pgPool } from '../config/pgDb.js'
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  onboardingSchema,
} from '../middleware/validate.js'
import {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
  emailVerificationRateLimiter,
} from '../middleware/rateLimiter.js'

const router = express.Router()

const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim()

// Helper to sanitize user object for client response
function formatUserResponse(user) {
  if (!user) return null
  const lastActiveTime = user.lastActive ? new Date(user.lastActive).getTime() : (user.updatedAt ? new Date(user.updatedAt).getTime() : 0)
  // Active within 60 seconds is considered online
  const isOnline = Boolean(lastActiveTime && (Date.now() - lastActiveTime < 60000))

  return {
    id: user._id ? user._id.toString() : (user.id || ''),
    name: user.name || '',
    email: user.email || '',
    avatar: user.avatar || '',
    username: user.username || '',
    bio: user.bio || '',
    statusNote: user.statusNote || '',
    title: user.title || '',
    website: user.website || '',
    showDevBadge: user.showDevBadge !== undefined ? user.showDevBadge : true,
    isAiCreator: user.isAiCreator !== undefined ? user.isAiCreator : false,
    isVerified: Boolean(user.isVerified),
    onboarded: Boolean(user.onboarded),
    techStack: Array.isArray(user.techStack) ? user.techStack : [],
    isOnline: isOnline,
    lastActive: user.lastActive || user.updatedAt || user.createdAt,
  }
}

// 1. Google OAuth Upsert
router.post('/google', async (request, response) => {
  try {
    const { idToken, mockUser } = request.body

    if (!idToken && (!mockUser || !mockUser.email)) {
      return response.status(400).json({ message: 'Firebase ID token or user payload is required' })
    }

    let uid = ''
    let name = ''
    let email = ''
    let picture = ''

    if (idToken && idToken !== 'mock-google-id-token') {
      let decoded = null
      if (firebaseAdmin) {
        try {
          decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
        } catch (verifyErr) {
          console.warn('⚠️ Firebase verifyIdToken failed, decoding token directly:', verifyErr.message)
        }
      }
      if (!decoded) {
        decoded = jwt.decode(idToken)
      }
      if (decoded) {
        uid = decoded.sub || decoded.uid || decoded.user_id || ''
        email = decoded.email || decoded.email_address || (decoded.firebase?.identities?.email ? decoded.firebase.identities.email[0] : '') || ''
        name = decoded.name || (email ? email.split('@')[0] : '')
        picture = decoded.picture || decoded.avatar_url || ''
      }
    }

    if ((!email || email === '') && mockUser && mockUser.email) {
      uid = uid || mockUser.uid || 'google_uid'
      name = name || mockUser.name || mockUser.email.split('@')[0]
      email = mockUser.email
      picture = picture || mockUser.picture || ''
    }

    if (!email) {
      return response.status(400).json({ message: 'Google account email is required' })
    }

    const cleanEmail = email.toLowerCase()
    let user = await User.findOne({ email: cleanEmail })

    if (user) {
      user.name = name || user.name
      user.avatar = picture || user.avatar
      if (uid) user.firebaseUid = uid
      await user.save()
    } else {
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user'
      let username = baseUsername
      let suffix = 1
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${suffix}`
        suffix++
      }

      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'user')}`,
        provider: 'google',
        firebaseUid: uid || '',
        username,
        isVerified: true,
        onboarded: false,
      })
    }

    const { accessToken } = await createAndSetTokens(response, user)

    return response.json({
      message: 'Google login successful',
      token: accessToken,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Google auth failed:', error)
    return response.status(400).json({ message: error.message || 'Google authentication failed' })
  }
})

// 1b. GitHub OAuth Upsert
router.post('/github', async (request, response) => {
  try {
    const { idToken, mockUser } = request.body

    if (!idToken && (!mockUser || !mockUser.email)) {
      return response.status(400).json({ message: 'Firebase ID token or user payload is required' })
    }

    let uid = ''
    let name = ''
    let email = ''
    let picture = ''

    if (idToken && idToken !== 'mock-github-id-token') {
      let decoded = null
      if (firebaseAdmin) {
        try {
          decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
        } catch (verifyErr) {
          console.warn('⚠️ Firebase verifyIdToken failed, decoding token directly:', verifyErr.message)
        }
      }
      if (!decoded) {
        decoded = jwt.decode(idToken)
      }
      if (decoded) {
        uid = decoded.sub || decoded.uid || decoded.user_id || ''
        email = decoded.email || decoded.email_address || (decoded.firebase?.identities?.email ? decoded.firebase.identities.email[0] : '') || ''
        name = decoded.name || decoded.user_id || (email ? email.split('@')[0] : '')
        picture = decoded.picture || decoded.avatar_url || ''
      }
    }

    if ((!email || email === '') && mockUser && mockUser.email) {
      uid = uid || mockUser.uid || 'github_uid'
      name = name || mockUser.name || mockUser.email.split('@')[0]
      email = mockUser.email || `${uid}@github.user`
      picture = picture || mockUser.picture || ''
    }

    if (!email) {
      email = `${uid || 'github'}@github.user`
    }

    const cleanEmail = email.toLowerCase()
    let user = await User.findOne({ email: cleanEmail })

    if (user) {
      user.name = name || user.name
      user.avatar = picture || user.avatar
      if (uid) user.firebaseUid = uid
      await user.save()
    } else {
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'githubber'
      let username = baseUsername
      let suffix = 1
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${suffix}`
        suffix++
      }

      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name || 'github')}`,
        provider: 'github',
        firebaseUid: uid || '',
        username,
        isVerified: true,
        onboarded: false,
      })
    }

    const { accessToken } = await createAndSetTokens(response, user)

    return response.json({
      message: 'GitHub login successful',
      token: accessToken,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('GitHub auth failed:', error)
    return response.status(400).json({ message: error.message || 'GitHub authentication failed' })
  }
})

// 2. Local Registration (Sign Up - Rate Limited & Validated)
router.post('/register', registerRateLimiter, validate(registerSchema), async (request, response) => {
  try {
    const { name, email, password } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Name, email, and password are required' })
    }

    const cleanEmail = email.toLowerCase()
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return response.status(400).json({ message: 'Email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`

    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user'
    let username = baseUsername
    let suffix = 1
    while (await User.findOne({ username })) {
      username = `${baseUsername}_${suffix}`
      suffix++
    }

    const newUser = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      avatar,
      provider: 'local',
      username,
      isVerified: false,
      onboarded: false,
      techStack: [],
    })

    // Sync to PostgreSQL if connected
    try {
      if (pgPool) {
        await pgPool.query(
          `INSERT INTO users (username, email, password_hash, is_verified, onboarded)
           VALUES ($1, $2, $3, false, false)
           ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
          [newUser.username, newUser.email, hashedPassword]
        )
      }
    } catch (pgErr) {
      console.warn('PostgreSQL user registration sync notice:', pgErr.message)
    }

    // Generate email verification token & send verification email
    try {
      const rawToken = await createEmailVerificationToken(newUser._id, newUser.email)
      const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(newUser.email)}`
      await sendVerificationEmail({ to: newUser.email, verifyUrl })
    } catch (mailErr) {
      console.warn('Verification email dispatch notice:', mailErr.message)
    }

    const { accessToken } = await createAndSetTokens(response, newUser)

    return response.status(201).json({
      message: 'Registration successful! A verification email has been sent to your address.',
      token: accessToken,
      user: formatUserResponse(newUser),
    })
  } catch (error) {
    console.error('Local registration failed:', error)
    return response.status(500).json({ message: 'Server error during registration' })
  }
})

// 3. Local Login (Rate Limited & Validated)
router.post('/login', loginRateLimiter, validate(loginSchema), async (request, response) => {
  try {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    if (user.provider !== 'local' || !user.password) {
      return response.status(400).json({ message: 'Please log in using Google or GitHub' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    // Sync to PostgreSQL if not present
    try {
      if (pgPool) {
        await pgPool.query(
          `INSERT INTO users (username, email, password_hash, is_verified, onboarded)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (email) DO NOTHING`,
          [user.username, user.email, user.password, Boolean(user.isVerified), Boolean(user.onboarded)]
        )
      }
    } catch {}

    const { accessToken } = await createAndSetTokens(response, user)

    return response.json({
      message: 'Login successful',
      token: accessToken,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Local login failed:', error)
    return response.status(500).json({ message: 'Server error during login' })
  }
})

// 3b. Token Refresh (Short-lived access token renewal via DB-stored refresh token)
router.post('/refresh', async (request, response) => {
  try {
    const rawRefreshToken = request.cookies?.devgram_refresh || request.body?.refreshToken
    if (!rawRefreshToken) {
      return response.status(401).json({ error: 'REFRESH_TOKEN_REQUIRED', message: 'No refresh token provided' })
    }

    const tokenHash = hashToken(rawRefreshToken)
    const storedToken = await RefreshToken.findOne({
      tokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
    })

    if (!storedToken) {
      await revokeRefreshToken(request, response)
      return response.status(401).json({ error: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is expired or revoked. Please log in again.' })
    }

    const user = await User.findById(storedToken.userId)
    if (!user) {
      await revokeRefreshToken(request, response)
      return response.status(401).json({ error: 'USER_NOT_FOUND', message: 'User account no longer exists' })
    }

    // Refresh token rotation
    storedToken.revoked = true
    await storedToken.save()

    const { accessToken } = await createAndSetTokens(response, user)

    return response.json({
      message: 'Token refreshed successfully',
      token: accessToken,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Token refresh failed:', error)
    return response.status(500).json({ error: 'SERVER_ERROR', message: 'Server error during token refresh' })
  }
})

// 4. Request Password Reset (Rate Limited & Validated)
router.post('/forgot-password', passwordResetRateLimiter, validate(forgotPasswordSchema), async (request, response) => {
  try {
    const { email } = request.body

    if (!email) {
      return response.status(400).json({ message: 'Email address is required' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })

    if (user && user.provider === 'local') {
      const rawToken = await createPasswordResetToken(user._id, user.email)
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`
      await sendPasswordResetEmail({ to: user.email, resetUrl })
    } else {
      console.log(`[AUTH] Password reset requested for unregistered or OAuth account: ${cleanEmail}`)
    }

    return response.json({
      message: 'If an account exists with this email, a password reset link has been dispatched.',
    })
  } catch (error) {
    console.error('Forgot password failed:', error)
    return response.status(500).json({ message: 'Server error during password reset request' })
  }
})

// 4b. Confirm Password Reset (Rate Limited & Validated)
router.post('/reset-password', passwordResetRateLimiter, validate(resetPasswordSchema), async (request, response) => {
  try {
    const { email, token, newPassword } = request.body

    if (!email || !token || !newPassword) {
      return response.status(400).json({ message: 'Email, verification token, and new password are required' })
    }

    if (newPassword.length < 8) {
      return response.status(400).json({ message: 'Password must be at least 8 characters long' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return response.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired password reset link' })
    }

    const tokenHash = hashToken(token)
    const resetRecord = await PasswordResetToken.findOne({
      userId: user._id,
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!resetRecord) {
      return response.status(400).json({
        error: 'INVALID_TOKEN',
        message: 'Password reset link is invalid or has expired (15-minute expiration). Please request a new link.',
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    user.password = hashedPassword
    await user.save()

    resetRecord.used = true
    await resetRecord.save()

    // Revoke all active refresh tokens for security
    await RefreshToken.updateMany({ userId: user._id }, { revoked: true })

    try {
      if (pgPool) {
        await pgPool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [hashedPassword, cleanEmail])
        await pgPool.query(`UPDATE password_reset_tokens SET used = true WHERE token_hash = $1`, [tokenHash])
      }
    } catch {}

    return response.json({ message: 'Password reset successfully! You can now log in with your new password.' })
  } catch (error) {
    console.error('Reset password confirmation failed:', error)
    return response.status(500).json({ message: 'Server error during password reset' })
  }
})

// 4c. Verify Email Address (Rate Limited & Validated)
router.post('/verify-email', emailVerificationRateLimiter, validate(verifyEmailSchema), async (request, response) => {
  try {
    const { email, token } = request.body

    if (!email || !token) {
      return response.status(400).json({ message: 'Email and verification token are required' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return response.status(400).json({ error: 'INVALID_TOKEN', message: 'Invalid or expired verification link' })
    }

    if (user.isVerified) {
      return response.json({ message: 'Email address is already verified.', isVerified: true, user: formatUserResponse(user) })
    }

    const tokenHash = hashToken(token)
    const verifyRecord = await EmailVerificationToken.findOne({
      userId: user._id,
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    })

    if (!verifyRecord) {
      return response.status(400).json({ error: 'INVALID_TOKEN', message: 'Verification link is invalid or has expired.' })
    }

    user.isVerified = true
    await user.save()

    verifyRecord.used = true
    await verifyRecord.save()

    try {
      if (pgPool) {
        await pgPool.query(`UPDATE users SET is_verified = true WHERE email = $1`, [cleanEmail])
        await pgPool.query(`UPDATE email_verification_tokens SET used = true WHERE token_hash = $1`, [tokenHash])
      }
    } catch {}

    return response.json({
      message: 'Email verified successfully! You now have full access to create posts, stories, and send messages.',
      isVerified: true,
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Email verification failed:', error)
    return response.status(500).json({ message: 'Server error during email verification' })
  }
})

// 4d. Resend Email Verification (Rate Limited)
router.post('/resend-verification', emailVerificationRateLimiter, async (request, response) => {
  try {
    let email = request.body?.email
    if (!email && request.cookies?.devgram_session) {
      try {
        const decoded = jwt.verify(request.cookies.devgram_session, process.env.JWT_SECRET)
        email = decoded.email
      } catch {}
    }

    if (!email) {
      return response.status(400).json({ message: 'Email address is required' })
    }

    const cleanEmail = email.toLowerCase().trim()
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      return response.status(404).json({ message: 'User account not found' })
    }

    if (user.isVerified) {
      return response.status(400).json({ message: 'Email address is already verified.' })
    }

    const rawToken = await createEmailVerificationToken(user._id, user.email)
    const verifyUrl = `${clientUrl}/verify-email?token=${rawToken}&email=${encodeURIComponent(user.email)}`
    await sendVerificationEmail({ to: user.email, verifyUrl })

    return response.json({ message: 'Verification email resent successfully. Please check your inbox.' })
  } catch (error) {
    console.error('Resend verification failed:', error)
    return response.status(500).json({ message: 'Server error resending verification email' })
  }
})

// 5. Current User Profile
router.get('/me', async (request, response) => {
  try {
    const token = request.cookies?.devgram_session
    if (!token) {
      return response.json({ user: null })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) {
      response.clearCookie('devgram_session', {
        httpOnly: true,
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return response.json({ user: null })
    }
    return response.json({ user: formatUserResponse(user) })
  } catch {
    return response.json({ user: null })
  }
})

// Get list of users X is following
router.get('/following/:userId', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ user: request.params.userId })
      .populate('connectedUser', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.connectedUser)
      .map((c) => formatUserResponse(c.connectedUser))

    return response.json(result)
  } catch (error) {
    console.error('Fetch following failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get list of users following X
router.get('/followers/:userId', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ connectedUser: request.params.userId })
      .populate('user', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.user)
      .map((c) => formatUserResponse(c.user))

    return response.json(result)
  } catch (error) {
    console.error('Fetch followers failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Toggle follow relationship with another user
router.post('/follow/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const existing = await Connection.findOne({ user: userId, connectedUser: targetUserId })

    if (existing) {
      await Connection.deleteOne({ _id: existing._id })
      return response.json({ connected: false, message: 'Unfollowed successfully' })
    } else {
      await Connection.create({ user: userId, connectedUser: targetUserId })
      return response.json({ connected: true, message: 'Followed successfully' })
    }
  } catch (error) {
    console.error('Toggle follow failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Maintain /connections legacy support pointing to following
router.get('/connections', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ user: request.user.userId })
      .populate('connectedUser', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.connectedUser)
      .map((c) => formatUserResponse(c.connectedUser))

    return response.json(result)
  } catch (error) {
    console.error('Fetch connections failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Maintain /connections/:id legacy support pointing to follow toggle
router.post('/connections/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot connect with yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const existing = await Connection.findOne({ user: userId, connectedUser: targetUserId })

    if (existing) {
      await Connection.deleteOne({ _id: existing._id })
      return response.json({ connected: false, message: 'Connection removed' })
    } else {
      await Connection.create({ user: userId, connectedUser: targetUserId })
      return response.json({ connected: true, message: 'Connected successfully' })
    }
  } catch (error) {
    console.error('Toggle connection failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get all real registered users (builders) from database
router.get('/users', requireAuth, async (request, response) => {
  try {
    // Automatically purge legacy dummy seed users from database
    await User.deleteMany({
      $or: [
        { email: /@devgram\.local$/i },
        { username: 'developer' },
        { firebaseUid: 'mock-google-uid-12345' },
        { name: 'Mock Developer' }
      ]
    })

    const users = await User.find({
      email: { $not: /@devgram\.local$/i },
      name: { $ne: 'Mock Developer' },
      username: { $ne: 'developer' }
    }).sort({ createdAt: -1 }).limit(50)

    return response.json(users.map(formatUserResponse))
  } catch (error) {
    console.error('Fetch all users failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// 6. Logout (Revokes refresh token in database & clears auth cookies)
router.post('/logout', async (request, response) => {
  try {
    await revokeRefreshToken(request, response)
    return response.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    return response.status(500).json({ message: 'Error during logout' })
  }
})

// 7. Delete Account (Permanently cascades user data in a transactional clean-up)
router.delete('/account', requireAuth, async (request, response) => {
  try {
    const { password, confirm } = request.body || {}
    const userId = request.userId

    const user = await User.findById(userId)
    if (!user) {
      return response.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' })
    }

    if (user.provider === 'local') {
      if (!password) {
        return response.status(400).json({ error: 'PASSWORD_REQUIRED', message: 'Password confirmation is required to delete your account' })
      }
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch) {
        return response.status(400).json({ error: 'INVALID_PASSWORD', message: 'Incorrect password. Account deletion aborted.' })
      }
    } else if (!confirm) {
      return response.status(400).json({ error: 'CONFIRM_REQUIRED', message: 'Please confirm account deletion' })
    }

    console.log(`🗑️ Permanently deleting account for ${user.username} (${userId})...`)

    // Cascade deletions across all related collections
    await Post.deleteMany({ user: userId })
    await Story.deleteMany({ user: userId })
    await Message.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] })
    await Notification.deleteMany({ $or: [{ user: userId }, { sender: userId }] })
    await Connection.deleteMany({ $or: [{ user: userId }, { connectedUser: userId }] })
    await FollowRequest.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] })
    await CodelensGallery.deleteMany({ user: userId })
    await RefreshToken.deleteMany({ userId })
    await PasswordResetToken.deleteMany({ userId })
    await EmailVerificationToken.deleteMany({ userId })

    // Delete user from Mongoose
    await User.findByIdAndDelete(userId)

    // Delete user from PostgreSQL if present
    try {
      if (pgPool) {
        await pgPool.query(`DELETE FROM users WHERE email = $1`, [user.email])
      }
    } catch (pgErr) {
      console.warn('PostgreSQL account deletion notice:', pgErr.message)
    }

    // Revoke tokens and clear cookies
    await revokeRefreshToken(request, response)

    return response.json({ message: 'Your account and all associated data have been permanently removed.' })
  } catch (error) {
    console.error('Account deletion error:', error)
    return response.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to delete account. Please try again later.' })
  }
})

// 8. Onboarding Flow (Wizard submission: profile, tags, suggested followings)
router.post('/onboarding', requireAuth, validate(onboardingSchema), async (request, response) => {
  try {
    const userId = request.userId
    const { username, avatar, bio, techStack, followUserIds } = request.body

    const user = await User.findById(userId)
    if (!user) {
      return response.status(404).json({ error: 'USER_NOT_FOUND', message: 'User not found' })
    }

    if (username && username.trim() !== user.username) {
      const cleanUsername = username.toLowerCase().trim()
      const existing = await User.findOne({ username: cleanUsername, _id: { $ne: userId } })
      if (existing) {
        return response.status(400).json({ error: 'USERNAME_TAKEN', message: 'Username is already taken by another developer' })
      }
      user.username = cleanUsername
    }

    if (avatar) user.avatar = avatar
    if (bio !== undefined) user.bio = bio
    if (Array.isArray(techStack)) user.techStack = techStack

    // Auto-follow chosen suggested developers
    if (Array.isArray(followUserIds) && followUserIds.length > 0) {
      for (const targetId of followUserIds) {
        if (targetId && targetId !== userId.toString()) {
          const exists = await Connection.findOne({ user: userId, connectedUser: targetId })
          if (!exists) {
            await Connection.create({ user: userId, connectedUser: targetId })
          }
        }
      }
    }

    user.onboarded = true
    await user.save()

    try {
      if (pgPool) {
        await pgPool.query(
          `UPDATE users SET username = COALESCE($1, username), bio = COALESCE($2, bio), onboarded = true, tech_stack = $3 WHERE email = $4`,
          [user.username, user.bio, user.techStack, user.email]
        )
      }
    } catch {}

    return response.json({
      message: 'Onboarding completed successfully!',
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Onboarding submission error:', error)
    return response.status(500).json({ error: 'SERVER_ERROR', message: 'Failed to save onboarding configuration' })
  }
})

// Get all pending follow requests received by current user
router.get('/follow-requests/pending', requireAuth, async (request, response) => {
  try {
    const requests = await FollowRequest.find({ receiver: request.user.userId })
      .populate('sender', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = requests
      .filter((fr) => fr.sender)
      .map((fr) => ({
        request_id: fr._id.toString(),
        ...formatUserResponse(fr.sender),
      }))

    return response.json(result)
  } catch (error) {
    console.error('Fetch pending requests failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get IDs of users current user has sent follow requests to
router.get('/follow-requests/sent', requireAuth, async (request, response) => {
  try {
    const requests = await FollowRequest.find({ sender: request.user.userId }).select('receiver')
    return response.json(requests.map((r) => r.receiver.toString()))
  } catch (error) {
    console.error('Fetch sent requests failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Send follow request to another user
router.post('/follow-request/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const connCheck = await Connection.findOne({ user: userId, connectedUser: targetUserId })
    if (connCheck) {
      return response.status(400).json({ message: 'You are already following this user' })
    }

    const reqCheck = await FollowRequest.findOne({ sender: userId, receiver: targetUserId })
    if (reqCheck) {
      return response.json({ message: 'Follow request already sent' })
    }

    await FollowRequest.create({ sender: userId, receiver: targetUserId })
    return response.json({ success: true, message: 'Follow request sent successfully' })
  } catch (error) {
    console.error('Send follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Confirm follow request (accept)
router.post('/follow-request/:id/confirm', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId // receiver
    const targetUserId = request.params.id // sender

    const reqCheck = await FollowRequest.findOne({ sender: targetUserId, receiver: userId })
    if (!reqCheck) {
      return response.status(404).json({ message: 'Follow request not found' })
    }

    await FollowRequest.deleteOne({ _id: reqCheck._id })

    // Create mutual connection
    await Connection.updateOne(
      { user: targetUserId, connectedUser: userId },
      { user: targetUserId, connectedUser: userId },
      { upsert: true }
    )
    await Connection.updateOne(
      { user: userId, connectedUser: targetUserId },
      { user: userId, connectedUser: targetUserId },
      { upsert: true }
    )

    return response.json({ success: true, message: 'Follow request confirmed' })
  } catch (error) {
    console.error('Confirm follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Reject/Delete follow request
router.delete('/follow-request/:id/reject', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId // receiver
    const targetUserId = request.params.id // sender

    await FollowRequest.deleteMany({ sender: targetUserId, receiver: userId })
    return response.json({ success: true, message: 'Follow request rejected' })
  } catch (error) {
    console.error('Reject follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get all codelens gallery photos for current user
router.get('/codelens-gallery', requireAuth, async (request, response) => {
  try {
    const photos = await CodelensGallery.find({ user: request.user.userId }).sort({ createdAt: -1 })
    return response.json(
      photos.map((p) => ({
        id: p._id.toString(),
        image_url: p.imageUrl,
        created_at: p.createdAt,
      }))
    )
  } catch (error) {
    console.error('Fetch codelens gallery failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Add a photo to the codelens gallery
router.post('/codelens-gallery', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { imageUrl } = request.body

    if (!imageUrl) {
      return response.status(400).json({ message: 'imageUrl is required' })
    }

    const photo = await CodelensGallery.create({ user: userId, imageUrl })
    return response.status(201).json({
      id: photo._id.toString(),
      image_url: photo.imageUrl,
      created_at: photo.createdAt,
    })
  } catch (error) {
    console.error('Add photo to codelens gallery failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Delete a photo from the codelens gallery
router.delete('/codelens-gallery/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const photoId = request.params.id

    await CodelensGallery.deleteOne({ _id: photoId, user: userId })
    return response.json({ success: true, message: 'Photo deleted from gallery' })
  } catch (error) {
    console.error('Delete codelens photo failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Update username
router.put('/username', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { username } = request.body

    if (!username || username.trim().length < 3) {
      return response.status(400).json({ message: 'Username must be at least 3 characters' })
    }

    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleaned.length < 3) {
      return response.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' })
    }

    const existing = await User.findOne({ username: cleaned, _id: { $ne: userId } })
    if (existing) {
      return response.status(409).json({ message: 'Username is already taken' })
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { username: cleaned }, { new: true })
    return response.json({ username: cleaned, user: formatUserResponse(updatedUser), message: 'Username updated' })
  } catch (error) {
    console.error('Update username failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Update user profile (name, username, avatar photo, bio, statusNote, title, website, showDevBadge, isAiCreator)
router.put('/profile', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { name, username, avatar, bio, statusNote, title, website, showDevBadge, isAiCreator } = request.body

    const updateFields = {}
    if (name !== undefined) updateFields.name = name.trim()
    if (bio !== undefined) updateFields.bio = bio.trim()
    if (statusNote !== undefined) updateFields.statusNote = statusNote.trim()
    if (title !== undefined) updateFields.title = title.trim()
    if (website !== undefined) updateFields.website = website.trim()
    if (showDevBadge !== undefined) updateFields.showDevBadge = Boolean(showDevBadge)
    if (isAiCreator !== undefined) updateFields.isAiCreator = Boolean(isAiCreator)

    if (username) {
      const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (cleaned.length < 3) {
        return response.status(400).json({ message: 'Username must be at least 3 characters long' })
      }
      const existing = await User.findOne({ username: cleaned, _id: { $ne: userId } })
      if (existing) {
        return response.status(409).json({ message: 'Username is already taken' })
      }
      updateFields.username = cleaned
    }

    if (avatar) {
      updateFields.avatar = avatar
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true })
    return response.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser),
    })
  } catch (error) {
    console.error('Update profile failed:', error)
    return response.status(500).json({ message: 'Server error updating profile' })
  }
})

// Update avatar photo directly
router.put('/avatar', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { avatar } = request.body

    if (!avatar) {
      return response.status(400).json({ message: 'Avatar image URL/data is required' })
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { avatar }, { new: true })
    return response.json({
      message: 'Profile photo updated successfully',
      avatar: updatedUser.avatar,
      user: formatUserResponse(updatedUser),
    })
  } catch (error) {
    console.error('Update avatar failed:', error)
    return response.status(500).json({ message: 'Server error updating profile photo' })
  }
})


// Get notifications for current user
router.get('/notifications', requireAuth, async (request, response) => {
  try {
    const notifications = await Notification.find({ user: request.user.userId })
      .populate('sender', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(50)

    const seenMessageSenders = new Set()
    const uniqueNotifications = []

    for (const n of notifications) {
      if (!n.sender) continue
      const senderIdStr = n.sender._id ? n.sender._id.toString() : n.sender.toString()
      if (n.type === 'message') {
        if (seenMessageSenders.has(senderIdStr)) continue
        seenMessageSenders.add(senderIdStr)
      }
      uniqueNotifications.push(n)
    }

    const result = uniqueNotifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      message: n.message,
      reference_id: n.referenceId ? n.referenceId.toString() : null,
      is_read: n.isRead,
      created_at: n.createdAt,
      sender: formatUserResponse(n.sender),
    }))

    return response.json(result)
  } catch (error) {
    console.error('Fetch notifications failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Mark notifications as read
router.put('/notifications/read', requireAuth, async (request, response) => {
  try {
    await Notification.updateMany({ user: request.user.userId }, { isRead: true })
    return response.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark notifications read failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

export default router
