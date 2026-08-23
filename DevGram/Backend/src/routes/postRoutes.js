import express from 'express'
import { requireAuth } from '../middleware/requireAuth.js'
import Post from '../models/Post.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// Helper to format post JSON output
function formatPostResponse(post) {
  const p = post.toObject ? post.toObject({ virtuals: true }) : post
  const u = p.user && typeof p.user === 'object' ? p.user : null

  return {
    _id: p._id.toString(),
    id: p._id.toString(),
    content: p.content,
    codeSnippet: p.codeSnippet || '',
    imageUrl: p.imageUrl || '',
    videoUrl: p.videoUrl || '',
    category: p.category || 'build',
    tags: p.tags || [],
    likes: (p.likes || []).map((l) => (typeof l === 'object' && l._id ? l._id.toString() : l.toString())),
    sharesCount: p.sharesCount || 0,
    saves: (p.saves || []).map((s) => (typeof s === 'object' && s._id ? s._id.toString() : s.toString())),
    comments: (p.comments || []).map((c) => {
      const cu = c.user && typeof c.user === 'object' ? c.user : null
      return {
        _id: c._id.toString(),
        id: c._id.toString(),
        text: c.text,
        createdAt: c.createdAt,
        user: cu
          ? {
              id: cu._id ? cu._id.toString() : cu.id,
              name: cu.name,
              email: cu.email,
              avatar: cu.avatar || '',
              username: cu.username || '',
            }
          : c.user ? c.user.toString() : null,
      }
    }),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    user: u
      ? {
          id: u._id ? u._id.toString() : u.id,
          name: u.name,
          email: u.email,
          avatar: u.avatar || '',
          username: u.username || '',
        }
      : null,
  }
}

// 1. GET all posts
router.get('/', async (_request, response) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')
      .sort({ createdAt: -1 })

    return response.json(posts.map(formatPostResponse))
  } catch (error) {
    console.error('Fetch posts failed:', error)
    return response.json([])
  }
})

// 2. GET single post by ID
router.get('/:id', async (request, response) => {
  try {
    const post = await Post.findById(request.params.id)
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')

    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    return response.json(formatPostResponse(post))
  } catch (error) {
    console.error('Fetch post by id failed:', error)
    return response.status(500).json({ message: 'Failed to fetch post' })
  }
})

// 3. POST create new post
router.post('/', requireAuth, async (request, response) => {
  try {
    const { content, codeSnippet, imageUrl, videoUrl, category, tags } = request.body

    if (!content || content.trim() === '') {
      return response.status(400).json({ message: 'Post content is required' })
    }

    const processedTags = Array.isArray(tags)
      ? tags
      : typeof tags === 'string'
        ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
        : []

    const userId = request.user.userId

    const newPost = await Post.create({
      user: userId,
      content,
      codeSnippet: codeSnippet || '',
      imageUrl: imageUrl || '',
      videoUrl: videoUrl || '',
      category: category || 'build',
      tags: processedTags,
      likes: [],
      sharesCount: 0,
      saves: [],
      comments: [],
    })

    const populatedPost = await Post.findById(newPost._id)
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')
    const user = populatedPost.user

    // Parse @mentions in content and create notifications
    const mentionRegex = /@([a-zA-Z0-9_]+)/g
    let match
    const mentionedUsernames = new Set()
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedUsernames.add(match[1].toLowerCase())
    }

    for (const mentionedUsername of mentionedUsernames) {
      try {
        const mentionedUser = await User.findOne({ username: mentionedUsername })
        if (mentionedUser && mentionedUser._id.toString() !== userId) {
          await Notification.create({
            user: mentionedUser._id,
            sender: userId,
            type: 'mention',
            referenceId: newPost._id,
            message: `@${user.username || user.name} mentioned you in a post`,
          })
        }
      } catch (mentionErr) {
        console.warn('Mention notification failed for @' + mentionedUsername + ':', mentionErr.message)
      }
    }

    return response.status(201).json(formatPostResponse(populatedPost))
  } catch (error) {
    console.error('Create post failed:', error)
    return response.status(500).json({ message: 'Failed to create post' })
  }
})

// 4. PUT update existing post
router.put('/:id', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const userId = request.user.userId
    const { content, codeSnippet, imageUrl, videoUrl, category, tags } = request.body

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    if (post.user.toString() !== userId) {
      return response.status(403).json({ message: 'Unauthorized to edit this post' })
    }

    if (content !== undefined) post.content = content
    if (codeSnippet !== undefined) post.codeSnippet = codeSnippet
    if (imageUrl !== undefined) post.imageUrl = imageUrl
    if (videoUrl !== undefined) post.videoUrl = videoUrl
    if (category !== undefined) post.category = category
    if (tags !== undefined) {
      post.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
          ? tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean)
          : []
    }

    await post.save()

    const updatedPost = await Post.findById(postId)
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')

    return response.json(formatPostResponse(updatedPost))
  } catch (error) {
    console.error('Update post failed:', error)
    return response.status(500).json({ message: 'Failed to update post' })
  }
})

// 5. DELETE post
router.delete('/:id', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const userId = request.user.userId

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    if (post.user.toString() !== userId) {
      return response.status(403).json({ message: 'Unauthorized to delete this post' })
    }

    await Post.findByIdAndDelete(postId)
    await Notification.deleteMany({ referenceId: postId })

    return response.json({ message: 'Post deleted successfully', postId })
  } catch (error) {
    console.error('Delete post failed:', error)
    return response.status(500).json({ message: 'Failed to delete post' })
  }
})

// 6. POST toggle like on post
router.post('/:id/like', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const userId = request.user.userId

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    const likeIndex = post.likes.findIndex((id) => id.toString() === userId)

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1)
    } else {
      post.likes.push(userId)
      // Send notification to post author if not liking own post
      if (post.user.toString() !== userId) {
        try {
          const senderUser = await User.findById(userId)
          await Notification.create({
            user: post.user,
            sender: userId,
            type: 'like',
            referenceId: post._id,
            message: `${senderUser.name} liked your post`,
          })
        } catch (notifErr) {
          console.warn('Like notification error:', notifErr.message)
        }
      }
    }

    await post.save()

    return response.json({
      postId,
      likesCount: post.likes.length,
      likes: post.likes.map((id) => id.toString()),
    })
  } catch (error) {
    console.error('Like toggle failed:', error)
    return response.status(500).json({ message: 'Failed to like/unlike post' })
  }
})

// 7. POST increment share/fork count on post
router.post('/:id/share', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    post.sharesCount = (post.sharesCount || 0) + 1
    await post.save()

    return response.json({
      postId,
      sharesCount: post.sharesCount
    })
  } catch (error) {
    console.error('Share post failed:', error)
    return response.status(500).json({ message: 'Failed to share post' })
  }
})

// 8. POST toggle save/bookmark on post
router.post('/:id/save', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const userId = request.user.userId

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    if (!post.saves) post.saves = []
    const saveIndex = post.saves.findIndex((id) => id.toString() === userId)

    if (saveIndex > -1) {
      post.saves.splice(saveIndex, 1)
    } else {
      post.saves.push(userId)
    }

    await post.save()

    return response.json({
      postId,
      saves: post.saves.map((id) => id.toString()),
    })
  } catch (error) {
    console.error('Save toggle failed:', error)
    return response.status(500).json({ message: 'Failed to save post' })
  }
})

// 7. POST add comment to post
router.post('/:id/comments', requireAuth, async (request, response) => {
  try {
    const postId = request.params.id
    const userId = request.user.userId
    const { text } = request.body

    if (!text || text.trim() === '') {
      return response.status(400).json({ message: 'Comment text is required' })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    post.comments.push({
      user: userId,
      text: text.trim(),
    })

    await post.save()

    // Send notification to post owner
    if (post.user.toString() !== userId) {
      try {
        const senderUser = await User.findById(userId)
        await Notification.create({
          user: post.user,
          sender: userId,
          type: 'comment',
          referenceId: post._id,
          message: `${senderUser.name} commented on your post`,
        })
      } catch (notifErr) {
        console.warn('Comment notification error:', notifErr.message)
      }
    }

    const updatedPost = await Post.findById(postId)
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')

    return response.status(201).json(formatPostResponse(updatedPost))
  } catch (error) {
    console.error('Add comment failed:', error)
    return response.status(500).json({ message: 'Failed to add comment' })
  }
})

// 8. DELETE comment from post
router.delete('/:id/comments/:commentId', requireAuth, async (request, response) => {
  try {
    const { id: postId, commentId } = request.params
    const userId = request.user.userId

    const post = await Post.findById(postId)
    if (!post) {
      return response.status(404).json({ message: 'Post not found' })
    }

    const comment = post.comments.id(commentId)
    if (!comment) {
      return response.status(404).json({ message: 'Comment not found' })
    }

    // Allow comment author OR post author to delete comment
    if (comment.user.toString() !== userId && post.user.toString() !== userId) {
      return response.status(403).json({ message: 'Unauthorized to delete this comment' })
    }

    post.comments.pull(commentId)
    await post.save()

    const updatedPost = await Post.findById(postId)
      .populate('user', 'name email avatar username')
      .populate('comments.user', 'name email avatar username')

    return response.json(formatPostResponse(updatedPost))
  } catch (error) {
    console.error('Delete comment failed:', error)
    return response.status(500).json({ message: 'Failed to delete comment' })
  }
})

export default router
