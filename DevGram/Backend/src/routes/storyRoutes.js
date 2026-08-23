import express from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import Story from '../models/Story.js'
import Connection from '../models/Connection.js'
import User from '../models/User.js'

const router = express.Router()

// Helper to calculate time remaining formatted string
function getTimeRemainingString(expiresAt) {
  const diffMs = new Date(expiresAt) - new Date()
  if (diffMs <= 0) return 'Expired'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  if (diffHours >= 1) return `${diffHours}h left`
  const diffMins = Math.floor(diffMs / (1000 * 60))
  return `${Math.max(1, diffMins)}m left`
}

// 1. GET /api/stories/feed - Ranked stories feed for current user
router.get('/feed', requireAuth, async (request, response) => {
  try {
    const currentUserId = request.user.userId
    const now = new Date()

    // 1. Fetch active non-expired stories
    const activeStories = await Story.find({ expiresAt: { $gt: now } })
      .populate('user', 'name username avatar email')
      .sort({ createdAt: 1 })

    // 2. Fetch current user's connections
    const userConnections = await Connection.find({ user: currentUserId }).select('connectedUser')
    const connectionUserIds = new Set(userConnections.map((c) => c.connectedUser.toString()))

    // 3. Group stories by user
    const userStoriesMap = new Map()

    activeStories.forEach((story) => {
      if (!story.user) return
      const uId = story.user._id.toString()
      const isSeen = story.viewers.some((v) => v.toString() === currentUserId)

      if (!userStoriesMap.has(uId)) {
        userStoriesMap.set(uId, {
          userId: uId,
          name: story.user.name,
          username: story.user.username || story.user.email.split('@')[0],
          avatarUrl: story.user.avatar || '',
          isOwn: uId === currentUserId,
          isConnection: connectionUserIds.has(uId),
          hasUnseen: false,
          latestCreatedAt: story.createdAt,
          stories: [],
        })
      }

      const userData = userStoriesMap.get(uId)
      if (!isSeen) {
        userData.hasUnseen = true
      }
      if (new Date(story.createdAt) > new Date(userData.latestCreatedAt)) {
        userData.latestCreatedAt = story.createdAt
      }

      userData.stories.push({
        id: story._id.toString(),
        mediaUrl: story.mediaUrl,
        caption: story.caption || '',
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        timeRemaining: getTimeRemainingString(story.expiresAt),
        seen: isSeen,
        viewersCount: story.viewers.length,
      })
    })

    // 4. Transform map values to array
    const userStoryGroups = Array.from(userStoriesMap.values())

    // 5. Rank / Order the user story circles
    userStoryGroups.sort((a, b) => {
      // Rule 1: Own profile always first
      if (a.isOwn) return -1
      if (b.isOwn) return 1

      // Rule 2: Unseen stories before seen stories
      if (a.hasUnseen && !b.hasUnseen) return -1
      if (!a.hasUnseen && b.hasUnseen) return 1

      // Rule 3: Connections before non-connections
      if (a.isConnection && !b.isConnection) return -1
      if (!a.isConnection && b.isConnection) return 1

      // Rule 4: Recency of latest story
      return new Date(b.latestCreatedAt) - new Date(a.latestCreatedAt)
    })

    return response.json(userStoryGroups)
  } catch (error) {
    console.error('Fetch stories feed failed:', error)
    return response.status(500).json({ message: 'Server error fetching stories' })
  }
})

// 2. POST /api/stories - Create new story (24-hour TTL)
router.post('/', requireAuth, async (request, response) => {
  try {
    const { mediaUrl, caption } = request.body
    if (!mediaUrl) {
      return response.status(400).json({ message: 'mediaUrl is required' })
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    const story = await Story.create({
      user: request.user.userId,
      mediaUrl,
      caption: caption || '',
      expiresAt,
      viewers: [request.user.userId], // Own story marked seen by author automatically
    })

    await story.populate('user', 'name username avatar email')

    return response.status(201).json({
      id: story._id.toString(),
      mediaUrl: story.mediaUrl,
      caption: story.caption,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      timeRemaining: getTimeRemainingString(story.expiresAt),
      seen: true,
    })
  } catch (error) {
    console.error('Create story failed:', error)
    return response.status(500).json({ message: 'Server error creating story' })
  }
})

// 3. POST /api/stories/:id/view - Mark story as viewed
router.post('/:id/view', requireAuth, async (request, response) => {
  try {
    const storyId = request.params.id
    const userId = request.user.userId

    await Story.updateOne({ _id: storyId }, { $addToSet: { viewers: userId } })

    return response.json({ success: true, storyId })
  } catch (error) {
    console.error('Mark story viewed failed:', error)
    return response.status(500).json({ message: 'Server error marking story viewed' })
  }
})

// 4. DELETE /api/stories/:id - Delete own story
router.delete('/:id', requireAuth, async (request, response) => {
  try {
    const storyId = request.params.id
    const userId = request.user.userId

    const result = await Story.deleteOne({ _id: storyId, user: userId })
    if (result.deletedCount === 0) {
      return response.status(404).json({ message: 'Story not found or unauthorized' })
    }

    return response.json({ success: true, message: 'Story deleted successfully' })
  } catch (error) {
    console.error('Delete story failed:', error)
    return response.status(500).json({ message: 'Server error deleting story' })
  }
})

export default router
