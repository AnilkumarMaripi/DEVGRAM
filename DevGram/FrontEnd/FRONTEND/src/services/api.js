// DevGram Centralized API Client Config
const rawApiUrl = import.meta.env.VITE_API_URL

function cleanUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  const match = trimmed.match(/(https?:\/\/[a-z0-9-]+\.(onrender\.com|vercel\.app|github\.io|com|net|org)|https?:\/\/localhost(:\d+)?)/i)
  return match ? match[0] : ''
}

const derivedUrl = cleanUrl(rawApiUrl)

export const API_BASE_URL = (derivedUrl && derivedUrl !== '')
  ? derivedUrl
  : (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app'))
    ? 'https://devgram-backend-q8uu.onrender.com'
    : 'http://localhost:5000'

/**
 * Constructs a full API URL given an endpoint path.
 * @param {string} endpoint - e.g. '/api/auth/me' or 'api/posts'
 * @returns {string} - Full URL string
 */
export function getApiUrl(endpoint = '') {
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${API_BASE_URL}${formattedEndpoint}`
}

/**
 * Universal fetch wrapper for DevGram API endpoints with credentials enabled.
 */
export async function apiFetch(endpoint, options = {}) {
  const url = getApiUrl(endpoint)
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
    credentials: options.credentials || 'include',
  })

  const contentType = response.headers.get('content-type') || ''
  let data
  if (contentType.includes('application/json')) {
    data = await response.json()
  } else {
    const text = await response.text()
    if (text.startsWith('<!DOCTYPE') || text.includes('<html')) {
      throw new Error(`Server returned non-JSON response (${response.status}). Please check API URL (${API_BASE_URL}).`)
    }
    try {
      data = JSON.parse(text)
    } catch {
      data = { message: text }
    }
  }

  if (!response.ok) {
    throw new Error(data.message || `API Request failed with status ${response.status}`)
  }

  return data
}
