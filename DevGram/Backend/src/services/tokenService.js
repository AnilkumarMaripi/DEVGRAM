import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import RefreshToken from '../models/RefreshToken.js'
import PasswordResetToken from '../models/PasswordResetToken.js'
import EmailVerificationToken from '../models/EmailVerificationToken.js'
import { pgPool } from '../config/pgDb.js'

export const ACCESS_TOKEN_EXPIRY = '15m'
export const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000 // 15 mins
export const REFRESH_TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

export function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

export function generateAccessToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  )
}

/**
 * Creates a cryptographically random refresh token, saves its SHA-256 hash to DB,
 * and sets secure httpOnly cookies.
 */
export async function createAndSetTokens(response, user) {
  const accessToken = generateAccessToken(user)

  // Generate 32-byte secure random string for refresh token
  const rawRefreshToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawRefreshToken)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)

  // 1. Store in MongoDB
  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
    revoked: false,
  })

  // 2. Optionally store in PostgreSQL if available
  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, revoked) 
         SELECT id, $1, $2, false FROM users WHERE email = $3
         ON CONFLICT (token_hash) DO NOTHING`,
        [tokenHash, expiresAt, user.email]
      )
    }
  } catch (pgErr) {
    // Non-blocking fallback
  }

  const isProduction = process.env.NODE_ENV === 'production'

  // Access Token Cookie
  response.cookie('devgram_session', accessToken, {
    httpOnly: true,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  })

  // Refresh Token Cookie (httpOnly)
  response.cookie('devgram_refresh', rawRefreshToken, {
    httpOnly: true,
    path: '/api/auth',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  })

  return { accessToken, rawRefreshToken }
}

/**
 * Revokes refresh token in database and clears auth cookies
 */
export async function revokeRefreshToken(request, response) {
  const rawToken = request.cookies?.devgram_refresh || request.body?.refreshToken
  if (rawToken) {
    const tokenHash = hashToken(rawToken)
    await RefreshToken.updateMany({ tokenHash }, { revoked: true })
    try {
      if (pgPool) {
        await pgPool.query(`UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1`, [tokenHash])
      }
    } catch {}
  }

  const isProduction = process.env.NODE_ENV === 'production'
  response.clearCookie('devgram_session', {
    httpOnly: true,
    path: '/',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  })
  response.clearCookie('devgram_refresh', {
    httpOnly: true,
    path: '/api/auth',
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  })
}

/**
 * Creates a one-time password reset token (15-min expiry)
 */
export async function createPasswordResetToken(userId, email) {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 mins

  // Invalidate any existing unused reset tokens for this user
  await PasswordResetToken.updateMany({ userId, used: false }, { used: true })

  await PasswordResetToken.create({
    userId,
    tokenHash,
    expiresAt,
    used: false,
  })

  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used)
         SELECT id, $1, $2, false FROM users WHERE email = $3`,
        [tokenHash, expiresAt, email]
      )
    }
  } catch {}

  return rawToken
}

/**
 * Creates an email verification token (24-hour expiry)
 */
export async function createEmailVerificationToken(userId, email) {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Invalidate any existing unused tokens for this user
  await EmailVerificationToken.updateMany({ userId, used: false }, { used: true })

  await EmailVerificationToken.create({
    userId,
    tokenHash,
    expiresAt,
    used: false,
  })

  try {
    if (pgPool) {
      await pgPool.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used)
         SELECT id, $1, $2, false FROM users WHERE email = $3`,
        [tokenHash, expiresAt, email]
      )
    }
  } catch {}

  return rawToken
}

