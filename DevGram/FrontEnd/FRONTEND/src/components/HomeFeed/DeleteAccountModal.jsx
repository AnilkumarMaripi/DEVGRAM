import { useState } from 'react'
import { deleteAccount } from '../../services/authService'

export default function DeleteAccountModal({ activeUser, onClose, onDeleted }) {
  const [password, setPassword] = useState('')
  const [confirmCheckbox, setConfirmCheckbox] = useState(false)
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isLocalAccount = activeUser?.provider === 'local'

  const handleDelete = async (e) => {
    e.preventDefault()
    setError('')

    if (isLocalAccount && !password) {
      setError('Please enter your current password to proceed.')
      return
    }

    if (!confirmCheckbox) {
      setError('Please check the confirmation box acknowledging permanent data deletion.')
      return
    }

    setIsDeleting(true)
    try {
      await deleteAccount({ password, confirm: true })
      if (onDeleted) {
        onDeleted()
      }
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please verify your password.')
      setIsDeleting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        background: '#121217',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '28px 24px',
        color: '#ffffff',
        boxShadow: '0 25px 60px -15px rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.8rem',
          margin: '0 auto 16px auto'
        }}>
          ⚠️
        </div>

        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', fontWeight: '800', textAlign: 'center', color: '#f87171' }}>
          Delete DevGram Account?
        </h3>

        <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#a1a1aa', textAlign: 'center', lineHeight: 1.5 }}>
          This will permanently delete your developer profile, all your posts, comments, stories, direct messages, and revoke all active sessions. This action <strong>cannot be undone</strong>.
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.85rem',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {isLocalAccount && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '6px' }}>
                Enter your password to confirm:
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Current password"
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: '#18181b',
                  border: '1px solid #27272a',
                  color: '#fff',
                  fontSize: '0.9rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', color: '#d4d4d8' }}>
            <input
              type="checkbox"
              checked={confirmCheckbox}
              onChange={(e) => setConfirmCheckbox(e.target.checked)}
              style={{ marginTop: '2px' }}
            />
            <span>I understand that all my builds, posts, messages, and followers will be permanently erased.</span>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              style={{
                flex: 1,
                padding: '11px',
                background: '#18181b',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              style={{
                flex: 1,
                padding: '11px',
                background: '#dc2626',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontWeight: '700',
                fontSize: '0.875rem',
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.6 : 1
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete Forever'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

