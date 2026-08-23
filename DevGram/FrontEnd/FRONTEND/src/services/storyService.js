import { API_BASE_URL } from './api'

const apiUrl = API_BASE_URL

export async function fetchStoriesFeed() {
  const response = await fetch(`${apiUrl}/api/stories/feed`, {
    method: 'GET',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch stories')
  }
  return data
}

export async function createStory(storyData) {
  const response = await fetch(`${apiUrl}/api/stories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(storyData),
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create story')
  }
  return data
}

export async function markStoryAsSeen(storyId) {
  const response = await fetch(`${apiUrl}/api/stories/${storyId}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to mark story as seen')
  }
  return data
}

export async function deleteStory(storyId) {
  const response = await fetch(`${apiUrl}/api/stories/${storyId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || 'Failed to delete story')
  }
  return data
}
