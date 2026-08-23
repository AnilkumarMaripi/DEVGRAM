import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { firebaseAdmin } from '../config/firebaseAdmin.js'
import { requireAuth } from '../middleware/requireAuth.js'
import User from '../models/User.js'
import Connection from '../models/Connection.js'
import FollowRequest from '../models/FollowRequest.js'
import CodelensGallery from '../models/CodelensGallery.js'
import Notification from '../models/Notification.js'

const router = express.Router()

// Helper to sanitize user object for client response
function formatUserResponse(user) {
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar || '',
    username: user.username || '',
    bio: user.bio || '',
    statusNote: user.statusNote || '',
    title: user.title || '',
    website: user.website || '',
    showDevBadge: user.showDevBadge !== undefined ? user.showDevBadge : true,
    isAiCreator: user.isAiCreator !== undefined ? user.isAiCreator : false,
  }
}

// 1. Google OAuth Upsert
router.post('/google', async (request, response) => {
  try {
    const { idToken, mockUser } = request.body

    if (!idToken) {
      return response.status(400).json({ message: 'Firebase ID token is required' })
    }

    let uid, name, email, picture

    if (process.env.NODE_ENV !== 'production' && idToken === 'mock-google-id-token' && mockUser) {
      console.warn('DevGram Backend: Verifying mock developer user.')
      uid = mockUser.uid
      name = mockUser.name
      email = mockUser.email
      picture = mockUser.picture
    } else {
      let decoded = null
      if (firebaseAdmin) {
        try {
          decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
        } catch (verifyErr) {
          console.warn('⚠️ Firebase verifyIdToken failed, decoding token directly:', verifyErr.message)
        }
      }
      if (!decoded) {
        decoded = jwt.decode(idToken)
      }
      if (!decoded) {
        return response.status(400).json({ message: 'Invalid token structure' })
      }

      uid = decoded.sub || decoded.uid || decoded.user_id || 'google_uid'
      email = decoded.email || decoded.email_address || (decoded.firebase?.identities?.email ? decoded.firebase.identities.email[0] : null) || `${uid}@google.user`
      name = decoded.name || (email && !email.endsWith('@google.user') ? email.split('@')[0] : 'Google User')
      picture = decoded.picture || decoded.avatar_url || ''
    }

    if (!email) {
      return response.status(400).json({ message: 'Google account email is required' })
    }

    const cleanEmail = email.toLowerCase()
    let user = await User.findOne({ email: cleanEmail })

    if (user) {
      user.name = name || user.name
      user.avatar = picture || user.avatar
      if (uid) user.firebaseUid = uid
      await user.save()
    } else {
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user'
      let username = baseUsername
      let suffix = 1
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${suffix}`
        suffix++
      }

      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: picture || '',
        provider: 'google',
        firebaseUid: uid || '',
        username,
      })
    }

    const sessionToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    response.cookie('devgram_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return response.json({
      message: 'Google login successful',
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Google auth failed:', error)
    return response.status(400).json({ message: error.message || 'Google authentication failed' })
  }
})

// 1b. GitHub OAuth Upsert
router.post('/github', async (request, response) => {
  try {
    const { idToken, mockUser } = request.body

    if (!idToken) {
      return response.status(400).json({ message: 'Firebase ID token is required' })
    }

    let uid, name, email, picture

    if (process.env.NODE_ENV !== 'production' && idToken === 'mock-github-id-token' && mockUser) {
      console.warn('DevGram Backend: Verifying mock GitHub developer user.')
      uid = mockUser.uid
      name = mockUser.name
      email = mockUser.email
      picture = mockUser.picture
    } else {
      let decoded = null
      if (firebaseAdmin) {
        try {
          decoded = await firebaseAdmin.auth().verifyIdToken(idToken)
        } catch (verifyErr) {
          console.warn('⚠️ Firebase verifyIdToken failed, decoding token directly:', verifyErr.message)
        }
      }
      if (!decoded) {
        decoded = jwt.decode(idToken)
      }
      if (!decoded) {
        return response.status(400).json({ message: 'Invalid token structure' })
      }

      uid = decoded.sub || decoded.uid || decoded.user_id || 'github_uid'
      email = decoded.email || decoded.email_address || `${uid}@github.user`
      name = decoded.name || decoded.user_id || (email && !email.endsWith('@github.user') ? email.split('@')[0] : 'GitHub User')
      picture = decoded.picture || decoded.avatar_url || ''
    }

    const cleanEmail = email.toLowerCase()
    let user = await User.findOne({ email: cleanEmail })

    if (user) {
      user.name = name || user.name
      user.avatar = picture || user.avatar
      if (uid) user.firebaseUid = uid
      await user.save()
    } else {
      const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'githubber'
      let username = baseUsername
      let suffix = 1
      while (await User.findOne({ username })) {
        username = `${baseUsername}_${suffix}`
        suffix++
      }

      user = await User.create({
        name: name || cleanEmail.split('@')[0],
        email: cleanEmail,
        avatar: picture || '',
        provider: 'github',
        firebaseUid: uid || '',
        username,
      })
    }

    const sessionToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    response.cookie('devgram_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return response.json({
      message: 'GitHub login successful',
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('GitHub auth failed:', error)
    return response.status(400).json({ message: error.message || 'GitHub authentication failed' })
  }
})

// 2. Local Registration (Sign Up)
router.post('/register', async (request, response) => {
  try {
    const { name, email, password } = request.body

    if (!name || !email || !password) {
      return response.status(400).json({ message: 'Name, email, and password are required' })
    }

    const cleanEmail = email.toLowerCase()
    const existingUser = await User.findOne({ email: cleanEmail })
    if (existingUser) {
      return response.status(400).json({ message: 'Email is already registered' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const avatar = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`

    const baseUsername = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user'
    let username = baseUsername
    let suffix = 1
    while (await User.findOne({ username })) {
      username = `${baseUsername}_${suffix}`
      suffix++
    }

    const newUser = await User.create({
      name,
      email: cleanEmail,
      password: hashedPassword,
      avatar,
      provider: 'local',
      username,
    })

    const sessionToken = jwt.sign(
      { userId: newUser._id.toString(), email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    response.cookie('devgram_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return response.json({
      message: 'Registration successful',
      user: formatUserResponse(newUser),
    })
  } catch (error) {
    console.error('Local registration failed:', error)
    return response.status(500).json({ message: 'Server error during registration' })
  }
})

// 3. Local Login
router.post('/login', async (request, response) => {
  try {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    if (user.provider !== 'local' || !user.password) {
      return response.status(400).json({ message: 'Please log in using Google' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return response.status(400).json({ message: 'Invalid email or password' })
    }

    const sessionToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    response.cookie('devgram_session', sessionToken, {
      httpOnly: true,
      path: '/',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    return response.json({
      message: 'Login successful',
      user: formatUserResponse(user),
    })
  } catch (error) {
    console.error('Local login failed:', error)
    return response.status(500).json({ message: 'Server error during login' })
  }
})

// 4. Reset Password
router.post('/forgot-password', async (request, response) => {
  try {
    const { email, password } = request.body

    if (!email || !password) {
      return response.status(400).json({ message: 'Email and new password are required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return response.status(400).json({ message: 'Email address not found' })
    }

    if (user.provider !== 'local') {
      return response.status(400).json({ message: 'Google authenticated accounts cannot reset password this way' })
    }

    user.password = await bcrypt.hash(password, 10)
    await user.save()

    return response.json({ message: 'Password updated successfully' })
  } catch (error) {
    console.error('Reset password failed:', error)
    return response.status(500).json({ message: 'Server error during password reset' })
  }
})

// 5. Current User Profile
router.get('/me', async (request, response) => {
  try {
    const token = request.cookies?.devgram_session
    if (!token) {
      return response.json({ user: null })
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)
    if (!user) {
      response.clearCookie('devgram_session', {
        httpOnly: true,
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return response.json({ user: null })
    }
    return response.json({ user: formatUserResponse(user) })
  } catch {
    return response.json({ user: null })
  }
})

// Get list of users X is following
router.get('/following/:userId', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ user: request.params.userId })
      .populate('connectedUser', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.connectedUser)
      .map((c) => formatUserResponse(c.connectedUser))

    return response.json(result)
  } catch (error) {
    console.error('Fetch following failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get list of users following X
router.get('/followers/:userId', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ connectedUser: request.params.userId })
      .populate('user', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.user)
      .map((c) => formatUserResponse(c.user))

    return response.json(result)
  } catch (error) {
    console.error('Fetch followers failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Toggle follow relationship with another user
router.post('/follow/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const existing = await Connection.findOne({ user: userId, connectedUser: targetUserId })

    if (existing) {
      await Connection.deleteOne({ _id: existing._id })
      return response.json({ connected: false, message: 'Unfollowed successfully' })
    } else {
      await Connection.create({ user: userId, connectedUser: targetUserId })
      return response.json({ connected: true, message: 'Followed successfully' })
    }
  } catch (error) {
    console.error('Toggle follow failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Maintain /connections legacy support pointing to following
router.get('/connections', requireAuth, async (request, response) => {
  try {
    const connections = await Connection.find({ user: request.user.userId })
      .populate('connectedUser', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = connections
      .filter((c) => c.connectedUser)
      .map((c) => formatUserResponse(c.connectedUser))

    return response.json(result)
  } catch (error) {
    console.error('Fetch connections failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Maintain /connections/:id legacy support pointing to follow toggle
router.post('/connections/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot connect with yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const existing = await Connection.findOne({ user: userId, connectedUser: targetUserId })

    if (existing) {
      await Connection.deleteOne({ _id: existing._id })
      return response.json({ connected: false, message: 'Connection removed' })
    } else {
      await Connection.create({ user: userId, connectedUser: targetUserId })
      return response.json({ connected: true, message: 'Connected successfully' })
    }
  } catch (error) {
    console.error('Toggle connection failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get all real registered users (builders) from database
router.get('/users', requireAuth, async (request, response) => {
  try {
    // Automatically purge legacy dummy seed users from database
    await User.deleteMany({
      $or: [
        { email: /@devgram\.local$/i },
        { username: 'developer' },
        { firebaseUid: 'mock-google-uid-12345' },
        { name: 'Mock Developer' }
      ]
    })

    const users = await User.find({
      email: { $not: /@devgram\.local$/i },
      name: { $ne: 'Mock Developer' },
      username: { $ne: 'developer' }
    }).sort({ createdAt: -1 }).limit(50)

    return response.json(users.map(formatUserResponse))
  } catch (error) {
    console.error('Fetch all users failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// 6. Logout
router.post('/logout', (_request, response) => {
  response.clearCookie('devgram_session', {
    httpOnly: true,
    path: '/',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return response.json({ message: 'Logged out successfully' })
})

// Get all pending follow requests received by current user
router.get('/follow-requests/pending', requireAuth, async (request, response) => {
  try {
    const requests = await FollowRequest.find({ receiver: request.user.userId })
      .populate('sender', 'name email avatar username')
      .sort({ createdAt: -1 })

    const result = requests
      .filter((fr) => fr.sender)
      .map((fr) => ({
        request_id: fr._id.toString(),
        ...formatUserResponse(fr.sender),
      }))

    return response.json(result)
  } catch (error) {
    console.error('Fetch pending requests failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get IDs of users current user has sent follow requests to
router.get('/follow-requests/sent', requireAuth, async (request, response) => {
  try {
    const requests = await FollowRequest.find({ sender: request.user.userId }).select('receiver')
    return response.json(requests.map((r) => r.receiver.toString()))
  } catch (error) {
    console.error('Fetch sent requests failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Send follow request to another user
router.post('/follow-request/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const targetUserId = request.params.id

    if (userId === targetUserId) {
      return response.status(400).json({ message: 'You cannot follow yourself' })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return response.status(404).json({ message: 'User not found' })
    }

    const connCheck = await Connection.findOne({ user: userId, connectedUser: targetUserId })
    if (connCheck) {
      return response.status(400).json({ message: 'You are already following this user' })
    }

    const reqCheck = await FollowRequest.findOne({ sender: userId, receiver: targetUserId })
    if (reqCheck) {
      return response.json({ message: 'Follow request already sent' })
    }

    await FollowRequest.create({ sender: userId, receiver: targetUserId })
    return response.json({ success: true, message: 'Follow request sent successfully' })
  } catch (error) {
    console.error('Send follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Confirm follow request (accept)
router.post('/follow-request/:id/confirm', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId // receiver
    const targetUserId = request.params.id // sender

    const reqCheck = await FollowRequest.findOne({ sender: targetUserId, receiver: userId })
    if (!reqCheck) {
      return response.status(404).json({ message: 'Follow request not found' })
    }

    await FollowRequest.deleteOne({ _id: reqCheck._id })

    // Create mutual connection
    await Connection.updateOne(
      { user: targetUserId, connectedUser: userId },
      { user: targetUserId, connectedUser: userId },
      { upsert: true }
    )
    await Connection.updateOne(
      { user: userId, connectedUser: targetUserId },
      { user: userId, connectedUser: targetUserId },
      { upsert: true }
    )

    return response.json({ success: true, message: 'Follow request confirmed' })
  } catch (error) {
    console.error('Confirm follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Reject/Delete follow request
router.delete('/follow-request/:id/reject', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId // receiver
    const targetUserId = request.params.id // sender

    await FollowRequest.deleteMany({ sender: targetUserId, receiver: userId })
    return response.json({ success: true, message: 'Follow request rejected' })
  } catch (error) {
    console.error('Reject follow request failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Get all codelens gallery photos for current user
router.get('/codelens-gallery', requireAuth, async (request, response) => {
  try {
    const photos = await CodelensGallery.find({ user: request.user.userId }).sort({ createdAt: -1 })
    return response.json(
      photos.map((p) => ({
        id: p._id.toString(),
        image_url: p.imageUrl,
        created_at: p.createdAt,
      }))
    )
  } catch (error) {
    console.error('Fetch codelens gallery failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Add a photo to the codelens gallery
router.post('/codelens-gallery', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { imageUrl } = request.body

    if (!imageUrl) {
      return response.status(400).json({ message: 'imageUrl is required' })
    }

    const photo = await CodelensGallery.create({ user: userId, imageUrl })
    return response.status(201).json({
      id: photo._id.toString(),
      image_url: photo.imageUrl,
      created_at: photo.createdAt,
    })
  } catch (error) {
    console.error('Add photo to codelens gallery failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Delete a photo from the codelens gallery
router.delete('/codelens-gallery/:id', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const photoId = request.params.id

    await CodelensGallery.deleteOne({ _id: photoId, user: userId })
    return response.json({ success: true, message: 'Photo deleted from gallery' })
  } catch (error) {
    console.error('Delete codelens photo failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Update username
router.put('/username', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { username } = request.body

    if (!username || username.trim().length < 3) {
      return response.status(400).json({ message: 'Username must be at least 3 characters' })
    }

    const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (cleaned.length < 3) {
      return response.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' })
    }

    const existing = await User.findOne({ username: cleaned, _id: { $ne: userId } })
    if (existing) {
      return response.status(409).json({ message: 'Username is already taken' })
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { username: cleaned }, { new: true })
    return response.json({ username: cleaned, user: formatUserResponse(updatedUser), message: 'Username updated' })
  } catch (error) {
    console.error('Update username failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Update user profile (name, username, avatar photo, bio, statusNote, title, website, showDevBadge, isAiCreator)
router.put('/profile', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { name, username, avatar, bio, statusNote, title, website, showDevBadge, isAiCreator } = request.body

    const updateFields = {}
    if (name !== undefined) updateFields.name = name.trim()
    if (bio !== undefined) updateFields.bio = bio.trim()
    if (statusNote !== undefined) updateFields.statusNote = statusNote.trim()
    if (title !== undefined) updateFields.title = title.trim()
    if (website !== undefined) updateFields.website = website.trim()
    if (showDevBadge !== undefined) updateFields.showDevBadge = Boolean(showDevBadge)
    if (isAiCreator !== undefined) updateFields.isAiCreator = Boolean(isAiCreator)

    if (username) {
      const cleaned = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
      if (cleaned.length < 3) {
        return response.status(400).json({ message: 'Username must be at least 3 characters long' })
      }
      const existing = await User.findOne({ username: cleaned, _id: { $ne: userId } })
      if (existing) {
        return response.status(409).json({ message: 'Username is already taken' })
      }
      updateFields.username = cleaned
    }

    if (avatar) {
      updateFields.avatar = avatar
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true })
    return response.json({
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser),
    })
  } catch (error) {
    console.error('Update profile failed:', error)
    return response.status(500).json({ message: 'Server error updating profile' })
  }
})

// Update avatar photo directly
router.put('/avatar', requireAuth, async (request, response) => {
  try {
    const userId = request.user.userId
    const { avatar } = request.body

    if (!avatar) {
      return response.status(400).json({ message: 'Avatar image URL/data is required' })
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { avatar }, { new: true })
    return response.json({
      message: 'Profile photo updated successfully',
      avatar: updatedUser.avatar,
      user: formatUserResponse(updatedUser),
    })
  } catch (error) {
    console.error('Update avatar failed:', error)
    return response.status(500).json({ message: 'Server error updating profile photo' })
  }
})


// Get notifications for current user
router.get('/notifications', requireAuth, async (request, response) => {
  try {
    const notifications = await Notification.find({ user: request.user.userId })
      .populate('sender', 'name avatar username')
      .sort({ createdAt: -1 })
      .limit(50)

    const result = notifications
      .filter((n) => n.sender)
      .map((n) => ({
        id: n._id.toString(),
        type: n.type,
        message: n.message,
        reference_id: n.referenceId ? n.referenceId.toString() : null,
        is_read: n.isRead,
        created_at: n.createdAt,
        sender: formatUserResponse(n.sender),
      }))

    return response.json(result)
  } catch (error) {
    console.error('Fetch notifications failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

// Mark notifications as read
router.put('/notifications/read', requireAuth, async (request, response) => {
  try {
    await Notification.updateMany({ user: request.user.userId }, { isRead: true })
    return response.json({ message: 'All notifications marked as read' })
  } catch (error) {
    console.error('Mark notifications read failed:', error)
    return response.status(500).json({ message: 'Server error' })
  }
})

export default router
