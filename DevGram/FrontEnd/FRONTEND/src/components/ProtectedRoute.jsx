import { useEffect } from 'react'
import { refreshSession } from '../services/authService'

export default function ProtectedRoute({ activeUser, onNavigate, onSessionRefreshed, children }) {
  useEffect(() => {
    if (!activeUser) {
      onNavigate('login')
      return
    }

    // Auto-refresh token every 12 minutes (before 15-minute access token expires)
    const interval = setInterval(async () => {
      try {
        const res = await refreshSession()
        if (res && res.user && onSessionRefreshed) {
          onSessionRefreshed(res.user)
        }
      } catch (e) {
        console.warn('Silent session refresh failed:', e)
      }
    }, 12 * 60 * 1000)

    return () => clearInterval(interval)
  }, [activeUser, onNavigate, onSessionRefreshed])

  if (!activeUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0a0a0c',
        color: '#a1a1aa',
        fontFamily: 'monospace'
      }}>
        Authenticating session...
      </div>
    )
  }

  return children
}

