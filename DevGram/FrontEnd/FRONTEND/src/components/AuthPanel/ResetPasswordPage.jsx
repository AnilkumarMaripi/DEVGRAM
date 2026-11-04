import { useState } from 'react'
import { confirmPasswordReset } from '../../services/authService'
import DevGramLogo from '../icons/DevGramLogo'

export default function ResetPasswordPage({ onNavigate }) {
  const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '')
  const emailFromUrl = params.get('email') || ''
  const tokenFromUrl = params.get('token') || ''

  const [email, setEmail] = useState(emailFromUrl)
  const [token, setToken] = useState(tokenFromUrl)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email || !token || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setIsSubmitting(true)
    try {
      await confirmPasswordReset({ email, token, newPassword: password })
      setSuccess('Your password has been reset successfully! Redirecting to login...')
      setTimeout(() => {
        onNavigate('login')
      }, 2500)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#09090b',
      color: '#ffffff',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#121217',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '36px 30px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <DevGramLogo size={32} />
          <span style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>DevGram</span>
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
          Set New Password
        </h2>
        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '0 0 24px 0', lineHeight: 1.5 }}>
          Create a secure password with at least 8 characters.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.15)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            color: '#4ade80',
            borderRadius: '8px',
            padding: '12px 14px',
            fontSize: '0.85rem',
            marginBottom: '18px'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>
              Reset Token
            </label>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              placeholder="Paste token from email"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fff',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>
              New Password (min 8 characters)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#18181b',
                border: '1px solid #27272a',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: '8px',
              padding: '12px',
              borderRadius: '8px',
              background: '#4f46e5',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              transition: 'background 0.2s',
            }}
          >
            {isSubmitting ? 'Updating Password...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('login')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#818cf8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              marginTop: '4px'
            }}
          >
            &larr; Back to Login
          </button>
        </form>
      </div>
    </div>
  )
}

