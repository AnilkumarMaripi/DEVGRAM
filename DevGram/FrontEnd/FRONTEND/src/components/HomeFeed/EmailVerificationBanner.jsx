import { useState } from 'react'
import { resendVerificationEmail } from '../../services/authService'

export default function EmailVerificationBanner({ activeUser }) {
  const [isSending, setIsSending] = useState(false)
  const [msg, setMsg] = useState('')
  const [dismissed, setDismissed] = useState(false)

  if (!activeUser || activeUser.isVerified || dismissed) {
    return null
  }

  const handleResend = async () => {
    setIsSending(true)
    setMsg('')
    try {
      const res = await resendVerificationEmail(activeUser.email)
      setMsg(res.message || 'Verification link sent! Check your inbox.')
    } catch (err) {
      setMsg(err.message || 'Failed to send verification email.')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(90deg, #312e81 0%, #1e1b4b 100%)',
      borderBottom: '1px solid #4338ca',
      color: '#e0e7ff',
      padding: '10px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '0.875rem',
      flexWrap: 'wrap',
      gap: '10px',
      position: 'relative',
      zIndex: 50
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.1rem' }}>✉️</span>
        <span>
          <strong>Please verify your email ({activeUser.email})</strong> to create posts, share stories, and message developers.
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {msg ? (
          <span style={{ color: '#a5b4fc', fontSize: '0.85rem' }}>{msg}</span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isSending}
            style={{
              background: '#4f46e5',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.8rem',
              fontWeight: '600',
              cursor: isSending ? 'not-allowed' : 'pointer'
            }}
          >
            {isSending ? 'Sending...' : 'Resend Link'}
          </button>
        )}

        <button
          type="button"
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#a5b4fc',
            cursor: 'pointer',
            fontSize: '1rem',
            padding: '2px 6px'
          }}
          title="Dismiss"
        >
          &times;
        </button>
      </div>
    </div>
  )
}

