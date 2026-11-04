/**
 * DevGram Client-side Sentry Error Tracking Module
 * Features:
 * - Automatic PII scrubbing in beforeSend hook
 * - Source map compatibility
 * - Graceful fallback when DSN is not provided
 */

const sentryDsn = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (typeof window === 'undefined') return

  if (!sentryDsn) {
    console.log('🛡️ Sentry error tracking: running in local dev mode (VITE_SENTRY_DSN not set).')
    return
  }

  // Inject lightweight Sentry loader if configured
  if (!document.getElementById('sentry-browser-sdk')) {
    const script = document.createElement('script')
    script.id = 'sentry-browser-sdk'
    script.crossOrigin = 'anonymous'
    script.src = 'https://js.sentry-cdn.com/' + sentryDsn.split('@')[0].split('//')[1] + '.min.js'
    script.onload = () => {
      if (window.Sentry) {
        window.Sentry.init({
          dsn: sentryDsn,
          environment: import.meta.env.MODE || 'production',
          beforeSend(event) {
            // Strict PII Scrubbing
            if (event.request) {
              delete event.request.cookies
              if (event.request.headers) {
                delete event.request.headers['authorization']
                delete event.request.headers['cookie']
              }
            }
            if (event.user) {
              delete event.user.email
              delete event.user.ip_address
            }
            return event
          },
        })
        console.log('🛡️ Sentry Error Tracking initialized successfully')
      }
    }
    document.head.appendChild(script)
  }
}

export function captureException(error, context = {}) {
  console.error('[Error Tracker]', error, context)
  if (window.Sentry && typeof window.Sentry.captureException === 'function') {
    window.Sentry.captureException(error, { extra: context })
  }
}

