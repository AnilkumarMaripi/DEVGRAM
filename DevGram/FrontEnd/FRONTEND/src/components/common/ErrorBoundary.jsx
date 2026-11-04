import React, { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('💥 DevGram UI Error Boundary caught an error:', error, errorInfo)
    if (window.Sentry) {
      window.Sentry.captureException(error)
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
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
            maxWidth: '480px',
            width: '100%',
            background: '#121217',
            border: '1px solid #27272a',
            borderRadius: '16px',
            padding: '32px 28px',
            textAlign: 'center',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              margin: '0 auto 16px auto'
            }}>
              ⚡
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '800', margin: '0 0 8px 0' }}>
              Something broke in the UI
            </h2>
            <p style={{ color: '#a1a1aa', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
              A client-side render error occurred. Don't worry, your account and database build data are safe.
            </p>

            <div style={{
              background: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.8rem',
              color: '#f87171',
              fontFamily: 'monospace',
              textAlign: 'left',
              overflowX: 'auto',
              marginBottom: '24px',
              maxHeight: '120px'
            }}>
              {this.state.error?.message || 'Unknown render failure'}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: '#27272a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: '#4f46e5',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

