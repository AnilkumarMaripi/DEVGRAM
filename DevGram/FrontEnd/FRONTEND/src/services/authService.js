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
  let firebaseIdToken
  let mockUser = null

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  if (useMock) {
    console.warn('DevGram: Using mock sign-in mode because VITE_USE_MOCK_AUTH is set to true.')
    firebaseIdToken = 'mock-google-id-token'
    mockUser = {
      uid: 'mock-google-uid-12345',
      name: 'Mock Developer',
      email: 'developer@devgram.local',
      picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    }
  } else {
    if (!apiKey || apiKey.includes('mock')) {
      throw new Error('Google Sign-In is not configured. Please set a valid VITE_FIREBASE_API_KEY in .env.')
    }

    try {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const result = await signInWithPopup(auth, provider)
      firebaseIdToken = await result.user.getIdToken()
    } catch (popupError) {
      console.error('Firebase Google Sign-In Error:', popupError)
      if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in popup was closed before completing.')
      } else if (popupError.code === 'auth/unauthorized-domain') {
        throw new Error(`Domain (${window.location.hostname}) not authorized in Firebase Console. Please add ${window.location.hostname} to Authorized Domains in Firebase.`)
      } else if (popupError.code === 'auth/popup-blocked') {
        throw new Error('Google sign-in popup was blocked by browser. Please allow popups for this site.')
      } else {
        throw new Error(popupError.message || 'Google sign-in failed. Please try again.')
      }
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

  const data = await safeJsonParse(response)

  if (!response.ok) {
    throw new Error(data.message || 'Google login failed')
  }

  return data
}

export async function signInWithGithub() {
  let firebaseIdToken
  let mockUser = null

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const useMock = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

  if (useMock) {
    console.warn('DevGram: Using mock sign-in mode because VITE_USE_MOCK_AUTH is set to true.')
    firebaseIdToken = 'mock-github-id-token'
    mockUser = {
      uid: 'mock-github-uid-67890',
      name: 'GitHub Developer',
      email: 'github.dev@devgram.local',
      picture: 'https://avatars.githubusercontent.com/u/9919?v=4',
    }
  } else {
    if (!apiKey || apiKey.includes('mock')) {
      throw new Error('GitHub Sign-In is not configured. Please set a valid VITE_FIREBASE_API_KEY in .env.')
    }

    try {
      const provider = new GithubAuthProvider()
      const result = await signInWithPopup(auth, provider)
      firebaseIdToken = await result.user.getIdToken()
    } catch (popupError) {
      console.error('Firebase GitHub Sign-In Error:', popupError)
      if (popupError.code === 'auth/popup-closed-by-user') {
        throw new Error('GitHub sign-in popup was closed before completing.')
      } else if (popupError.code === 'auth/operation-not-allowed') {
        throw new Error('GitHub Sign-In is not enabled in Firebase Console. Go to Firebase Console -> Authentication -> Sign-in method and enable GitHub.')
      } else if (popupError.code === 'auth/unauthorized-domain') {
        throw new Error(`Domain (${window.location.hostname}) not authorized in Firebase Console. Please add ${window.location.hostname} to Authorized Domains in Firebase.`)
      } else if (popupError.code === 'auth/popup-blocked') {
        throw new Error('GitHub sign-in popup was blocked by browser. Please allow popups for this site.')
      } else if (popupError.code === 'auth/invalid-credential' || (popupError.message && popupError.message.includes('incorrect_client_credentials'))) {
        throw new Error('Incorrect GitHub Client ID or Client Secret. Please re-copy your Client ID & Client Secret from GitHub into Firebase Console.')
      } else if (popupError.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with the same email address using a different sign-in provider.')
      } else {
        throw new Error(popupError.message || 'GitHub sign-in failed. Please try again.')
      }
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

  const data = await safeJsonParse(response)

  if (!response.ok) {
    throw new Error(data.message || 'GitHub login failed')
  }

  return data
}

export async function checkAuthStatus() {
  const response = await fetch(`${apiUrl}/api/auth/me`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Not authenticated')
  }
  return data
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
