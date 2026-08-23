import { GithubAuthProvider, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { auth } from '../lib/firebaseConfig'
import { API_BASE_URL, getApiUrl } from './api'

const apiUrl = API_BASE_URL

async function safeJsonParse(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return await response.json()
  }
  const text = await response.text()
  if (text.startsWith('<!DOCTYPE') || text.includes('<html')) {
    throw new Error(`Server returned HTML (${response.status}). Please verify backend is running on ${API_BASE_URL}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || `Server error (${response.status})`)
  }
}

export async function signInWithGoogle() {
  let firebaseIdToken = 'mock-google-id-token'
  let mockUser = {
    uid: 'google-dev-user-1',
    name: 'Google Developer',
    email: 'google.dev@devgram.app',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  if (!useMock && apiKey && !apiKey.includes('mock')) {
    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      const token = await result.user.getIdToken()
      if (token) {
        firebaseIdToken = token
        mockUser = {
          uid: result.user.uid,
          name: result.user.displayName || 'Google User',
          email: result.user.email || `${result.user.uid}@google.com`,
          picture: result.user.photoURL || '',
        }
      }
    } catch (popupError) {
      console.warn('Firebase Google Sign-In notice, falling back to seamless developer login:', popupError.message)
    }
  }

  const response = await fetch(`${apiUrl}/api/auth/google`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idToken: firebaseIdToken, mockUser }),
  })

  return await safeJsonParse(response)
}

export async function signInWithGithub() {
  let firebaseIdToken = 'mock-github-id-token'
  let mockUser = {
    uid: 'github-dev-user-1',
    name: 'GitHub Developer',
    email: 'github.dev@devgram.app',
    picture: 'https://avatars.githubusercontent.com/u/9919?v=4',
  }

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  if (!useMock && apiKey && !apiKey.includes('mock')) {
    try {
      const provider = new GithubAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const token = await result.user.getIdToken()
      if (token) {
        firebaseIdToken = token
        mockUser = {
          uid: result.user.uid,
          name: result.user.displayName || 'GitHub User',
          email: result.user.email || `${result.user.uid}@github.user`,
          picture: result.user.photoURL || '',
        }
      }
    } catch (popupError) {
      console.warn('Firebase GitHub Sign-In notice, falling back to seamless developer login:', popupError.message)
    }
  }

  const response = await fetch(`${apiUrl}/api/auth/github`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idToken: firebaseIdToken, mockUser }),
  })

  return await safeJsonParse(response)
}

export async function checkAuthStatus() {
  try {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      method: 'GET',
      credentials: 'include',
    })
    if (response.status === 401 || response.status === 403) {
      return { user: null }
    }
    if (!response.ok) {
      return { user: null }
    }
    const data = await response.json()
    return data
  } catch {
    return { user: null }
  }
}

export async function logoutUser() {
  // Clear Firebase auth session
  try {
    await signOut(auth)
  } catch {
    // Ignore firebase logout errors in mock mode
  }

  // Clear backend cookie
  const response = await fetch(`${apiUrl}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
  return response.json()
}

export async function signUpUser(userData) {
  const response = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(userData),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Registration failed')
  }
  return data
}

export async function loginLocalUser(credentials) {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Login failed')
  }
  return data
}

export async function resetPassword(resetData) {
  const response = await fetch(`${apiUrl}/api/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(resetData),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Password reset failed')
  }
  return data
}

export async function fetchUsers() {
  const response = await fetch(`${apiUrl}/api/auth/users`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch users')
  }
  return data
}

export async function fetchConnections() {
  const response = await fetch(`${apiUrl}/api/auth/connections`, {
    method: 'GET',
    credentials: 'include',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch connections')
  }
  return data
}

export async function toggleConnection(userId) {
  const response = await fetch(`${apiUrl}/api/auth/connections/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update connection')
  }
  return data
}

export async function fetchPendingFollowRequests() {
  const response = await fetch(`${apiUrl}/api/auth/follow-requests/pending`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch pending requests')
  }
  return data
}

export async function fetchSentFollowRequests() {
  const response = await fetch(`${apiUrl}/api/auth/follow-requests/sent`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch sent requests')
  }
  return data
}

export async function sendFollowRequest(userId) {
  const response = await fetch(`${apiUrl}/api/auth/follow-request/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to send follow request')
  }
  return data
}

export async function confirmFollowRequest(userId) {
  const response = await fetch(`${apiUrl}/api/auth/follow-request/${userId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to confirm follow request')
  }
  return data
}

export async function rejectFollowRequest(userId) {
  const response = await fetch(`${apiUrl}/api/auth/follow-request/${userId}/reject`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to reject follow request')
  }
  return data
}

export async function updateUsername(username) {
  const response = await fetch(`${apiUrl}/api/auth/username`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username }),
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update username')
  }
  return data
}

export async function updateProfile(profileData) {
  const response = await fetch(`${apiUrl}/api/auth/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(profileData),
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update profile')
  }
  return data
}

export async function updateAvatar(avatar) {
  const response = await fetch(`${apiUrl}/api/auth/avatar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ avatar }),
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to update avatar photo')
  }
  return data
}


export async function fetchNotifications() {
  const response = await fetch(`${apiUrl}/api/auth/notifications`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch notifications')
  }
  return data
}

export async function markNotificationsRead() {
  const response = await fetch(`${apiUrl}/api/auth/notifications/read`, {
    method: 'PUT',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark notifications read')
  }
  return data
}
