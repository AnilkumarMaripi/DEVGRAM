/**
 * DevGram Privacy-Friendly Analytics Service (PostHog & Plausible compatible)
 * Tracks pageviews and key product metrics without tracking PII.
 */

const posthogKey = import.meta.env.VITE_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com'
const plausibleDomain = import.meta.env.VITE_PLAUSIBLE_DOMAIN

let isInitialized = false

export function initAnalytics() {
  if (typeof window === 'undefined' || isInitialized) return
  isInitialized = true

  // Optional: Load Plausible privacy script if domain configured
  if (plausibleDomain && !document.getElementById('plausible-script')) {
    const script = document.createElement('script')
    script.id = 'plausible-script'
    script.defer = true
    script.setAttribute('data-domain', plausibleDomain)
    script.src = 'https://plausible.io/js/script.js'
    document.head.appendChild(script)
  }

  console.log('📊 DevGram Privacy-Friendly Analytics initialized')
}

export function trackPageView(pageName) {
  if (typeof window === 'undefined') return
  const path = window.location.pathname + window.location.hash
  console.log(`[Analytics] PageView: ${pageName} (${path})`)

  if (window.plausible) {
    window.plausible('pageview', { u: path })
  }
}

export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return

  // Scrub PII: ensure email, password, tokens are never tracked
  const sanitized = { ...properties }
  delete sanitized.email
  delete sanitized.password
  delete sanitized.token
  delete sanitized.refreshToken

  console.log(`[Analytics] Event: ${eventName}`, sanitized)

  if (window.plausible) {
    window.plausible(eventName, { props: sanitized })
  }
}

