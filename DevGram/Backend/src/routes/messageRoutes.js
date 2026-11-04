import express from 'express'
import { requireAuth, requireVerifiedEmail } from '../middleware/requireAuth.js'
import { validate, sendMessageSchema } from '../middleware/validate.js'
import { writeRateLimiter } from '../middleware/rateLimiter.js'
import Message from '../models/Message.js'
import User from '../models/User.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// Helper to format message response
function formatMessage(msg) {
  return {
    id: msg._id.toString(),
    _id: msg._id.toString(),
    senderId: msg.sender._id ? msg.sender._id.toString() : msg.sender.toString(),
    recipientId: msg.recipient._id ? msg.recipient._id.toString() : msg.recipient.toString(),
    text: msg.text,
    isRead: msg.isRead,
    createdAt: msg.createdAt,
  }
}

// 1. GET all chat conversation partners for current user
router.get('/conversations', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId

    // Find all messages involving current user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'name email avatar username')
      .populate('recipient', 'name email avatar username')

    const partnerMap = new Map()

    for (const msg of messages) {
      const isSender = (msg.sender._id ? msg.sender._id.toString() : msg.sender.toString()) === userId
      const partner = isSender ? msg.recipient : msg.sender

      if (partner && partner._id) {
        const partnerId = partner._id.toString()
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            id: partnerId,
            name: partner.name,
            email: partner.email,
            avatar: partner.avatar || '',
            username: partner.username || '',
            lastMessage: msg.text,
            lastMessageTime: msg.createdAt,
          })
        }
      }
    }

    return response.json(Array.from(partnerMap.values()))
  } catch (error) {
    console.error('Fetch conversations failed:', error)
    return response.status(500).json({ message: 'Server error fetching conversations' })
  }
})

// 2. GET full message history between current user and otherUserId
router.get('/:otherUserId', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const otherUserId = request.params.otherUserId

    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId },
      ],
    }).sort({ createdAt: 1 })

    // Mark unread messages as read
    await Message.updateMany(
      { sender: otherUserId, recipient: userId, isRead: false },
      { isRead: true }
    )

    return response.json(messages.map(formatMessage))
  } catch (error) {
    console.error('Fetch chat history failed:', error)
    return response.status(500).json({ message: 'Server error fetching chat history' })
  }
})

// 3. POST send message to otherUserId (Rate Limited & Validated)
router.post('/:otherUserId', requireAuth, requireVerifiedEmail, writeRateLimiter, validate(sendMessageSchema), async (request, response) => {
  try {
    const userId = request.user.userId
    const otherUserId = request.params.otherUserId
    const { text } = request.body

    const recipientUser = await User.findById(otherUserId)
    if (!recipientUser) {
      return response.status(404).json({ message: 'Recipient user not found' })
    }

    const newMsg = await Message.create({
      sender: userId,
      recipient: otherUserId,
      text: text.trim(),
    })

    // Create or update single notification for recipient from this sender
    try {
      const senderUser = await User.findById(userId)
      await Notification.findOneAndUpdate(
        { user: otherUserId, sender: userId, type: 'message' },
        {
          referenceId: newMsg._id,
          message: `${senderUser.name} sent you a message`,
          isRead: false,
          createdAt: new Date(),
        },
        { upsert: true, new: true }
      )
    } catch (notifErr) {
      console.warn('Message notification failed:', notifErr.message)
    }

    return response.status(201).json(formatMessage(newMsg))
  } catch (error) {
    console.error('Send message failed:', error)
    return response.status(500).json({ message: 'Server error sending message' })
  }
})

// 4. DELETE /api/messages/:id - Delete own message (Ownership verified)
router.delete('/:id', requireAuth, async (request, response) => {
  try {
    const messageId = request.params.id
    const userId = request.user.userId

    const message = await Message.findById(messageId)
    if (!message) {
      return response.status(404).json({ message: 'Message not found' })
    }

    if (message.sender.toString() !== userId) {
      return response.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized: You can only delete messages sent by you.' })
    }

    await Message.findByIdAndDelete(messageId)
    return response.json({ message: 'Message deleted successfully', messageId })
  } catch (error) {
    console.error('Delete message failed:', error)
    return response.status(500).json({ message: 'Failed to delete message' })
  }
})

export default router
