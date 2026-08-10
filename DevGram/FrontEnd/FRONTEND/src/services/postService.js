import { API_BASE_URL } from './api'

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

export async function fetchPosts() {
  const response = await fetch(`${apiUrl}/api/posts`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch posts')
  }
  return data
}

export async function createPost(postData) {
  const response = await fetch(`${apiUrl}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(postData),
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create post')
  }
  return data
}

export async function likePost(postId) {
  const response = await fetch(`${apiUrl}/api/posts/${postId}/like`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  })
  const data = await safeJsonParse(response)
  if (!response.ok) {
    throw new Error(data.message || 'Failed to toggle like')
  }
  return data
}
