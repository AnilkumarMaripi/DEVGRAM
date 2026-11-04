import { useState, useEffect } from 'react'
import { verifyEmail, resendVerificationEmail } from '../../services/authService'
import DevGramLogo from '../icons/DevGramLogo'

export default function VerifyEmailPage({ onNavigate, onVerificationSuccess }) {
  const params = new URLSearchParams(window.location.search || window.location.hash.split('?')[1] || '')
  const emailFromUrl = params.get('email') || ''
  const tokenFromUrl = params.get('token') || ''

  const [status, setStatus] = useState('verifying') // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying your email address...')
  const [resendStatus, setResendStatus] = useState('')

  useEffect(() => {
    if (!tokenFromUrl || !emailFromUrl) {
      setStatus('error')
      setMessage('Missing verification token or email. Please use the link provided in your email.')
      return
    }

    let isMounted = true
    const doVerify = async () => {
      try {
        const res = await verifyEmail({ email: emailFromUrl, token: tokenFromUrl })
        if (!isMounted) return
        setStatus('success')
        setMessage(res.message || 'Email verified successfully!')
        if (onVerificationSuccess && res.user) {
          onVerificationSuccess(res.user)
        }
      } catch (err) {
        if (!isMounted) return
        setStatus('error')
        setMessage(err.message || 'Verification link is invalid or has expired.')
      }
    }

    doVerify()
    return () => { isMounted = false }
  }, [tokenFromUrl, emailFromUrl])

  const handleResend = async () => {
    setResendStatus('Sending...')
    try {
      await resendVerificationEmail(emailFromUrl)
      setResendStatus('New verification link sent to your email!')
    } catch (err) {
      setResendStatus(err.message || 'Failed to resend. Please try again.')
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
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
          <DevGramLogo size={36} />
          <span style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em' }}>DevGram</span>
        </div>

        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          margin: '0 auto 20px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          background: status === 'success' ? 'rgba(34, 197, 94, 0.15)' : status === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
          border: status === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : status === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          {status === 'success' ? '✅' : status === 'error' ? '❌' : '⏳'}
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: '700', margin: '0 0 10px 0' }}>
          {status === 'success' ? 'Email Verified!' : status === 'error' ? 'Verification Failed' : 'Verifying Email...'}
        </h2>

        <p style={{ color: '#a1a1aa', fontSize: '0.9rem', lineHeight: 1.5, marginBottom: '24px' }}>
          {message}
        </p>

        {status === 'success' && (
          <button
            type="button"
            onClick={() => onNavigate('home')}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              background: '#059669',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              fontSize: '0.95rem',
              cursor: 'pointer'
            }}
          >
            Enter DevGram Feed &rarr;
          </button>
        )}

        {status === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {emailFromUrl && (
              <button
                type="button"
                onClick={handleResend}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: '#4f46e5',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Resend Verification Link
              </button>
            )}

            {resendStatus && (
              <p style={{ fontSize: '0.85rem', color: '#818cf8', margin: '4px 0' }}>
                {resendStatus}
              </p>
            )}

            <button
              type="button"
              onClick={() => onNavigate('login')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

