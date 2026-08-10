import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.resolve(__dirname, '../.env') })

import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Post from '../src/models/Post.js'
import Notification from '../src/models/Notification.js'
import Connection from '../src/models/Connection.js'
import bcrypt from 'bcryptjs'


async function runCrudPipelineTest() {
  console.log('====================================================')
  console.log('🚀 Starting DevGram End-to-End CRUD & Pipeline Test')
  console.log('Target Database: Live MongoDB Atlas')
  console.log('====================================================\n')

  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI missing from environment!')
  }

  // Step 1: Connect to MongoDB Atlas
  console.log('[1/6] Connecting to MongoDB Atlas...')
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
  console.log('✅ Connected successfully to MongoDB Atlas!\n')

  // Cleanup past test users if present
  await User.deleteMany({ email: { $in: ['alpha_test@devgram.io', 'beta_test@devgram.io'] } })

  let userAlpha, userBeta, createdPost

  try {
    // Step 2: USER CRUD
    console.log('[2/6] Executing USER CRUD Operations...')
    
    // CREATE Users
    const hashedPass = await bcrypt.hash('TestPass123!', 10)
    userAlpha = await User.create({
      name: 'Alpha Developer',
      email: 'alpha_test@devgram.io',
      password: hashedPass,
      username: 'alpha_dev_test',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alpha',
      provider: 'local',
    })
    console.log(`  ✓ CREATE User 1: ${userAlpha.name} (ID: ${userAlpha._id})`)

    userBeta = await User.create({
      name: 'Beta Engineer',
      email: 'beta_test@devgram.io',
      password: hashedPass,
      username: 'beta_dev_test',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Beta',
      provider: 'local',
    })
    console.log(`  ✓ CREATE User 2: ${userBeta.name} (ID: ${userBeta._id})`)

    // READ User
    const fetchedAlpha = await User.findById(userAlpha._id)
    console.log(`  ✓ READ User: ${fetchedAlpha.email} (Username: @${fetchedAlpha.username})`)

    // UPDATE User
    fetchedAlpha.name = 'Alpha Senior Developer'
    await fetchedAlpha.save()
    console.log(`  ✓ UPDATE User: Name updated to "${fetchedAlpha.name}"`)
    console.log('✅ USER CRUD Passed!\n')

    // Step 3: POST CRUD
    console.log('[3/6] Executing POST CRUD Operations...')

    // CREATE Post (with @mention for userBeta)
    createdPost = await Post.create({
      user: userAlpha._id,
      content: 'Building fullstack apps with Node.js and MongoDB Atlas! CC @beta_dev_test',
      codeSnippet: 'const db = await mongoose.connect(process.env.MONGODB_URI);',
      category: 'build',
      tags: ['nodejs', 'mongodb', 'atlas'],
      likes: [],
      comments: [],
    })
    console.log(`  ✓ CREATE Post: (ID: ${createdPost._id}) Content: "${createdPost.content.substring(0, 45)}..."`)

    // READ Posts
    const allPosts = await Post.find({ _id: createdPost._id }).populate('user', 'name email username')
    console.log(`  ✓ READ Posts: Found ${allPosts.length} post, Author: ${allPosts[0].user.name}`)

    // UPDATE Post
    createdPost.content = 'Updated: Building high performance fullstack apps with Node.js & MongoDB Atlas! CC @beta_dev_test'
    createdPost.tags.push('fullstack')
    await createdPost.save()
    console.log(`  ✓ UPDATE Post: Content updated, Tags: [${createdPost.tags.join(', ')}]`)

    // TOGGLE LIKE
    createdPost.likes.push(userBeta._id)
    await createdPost.save()
    console.log(`  ✓ UPDATE Post (LIKE): User Beta liked post (Total Likes: ${createdPost.likes.length})`)

    // CREATE COMMENT
    createdPost.comments.push({
      user: userBeta._id,
      text: 'Awesome MongoDB Atlas integration!',
    })
    await createdPost.save()
    console.log(`  ✓ CREATE Comment: User Beta added comment ("${createdPost.comments[0].text}")`)

    // READ Post with populated comments
    const populatedPost = await Post.findById(createdPost._id).populate('comments.user', 'name username')
    console.log(`  ✓ READ Post Comments: Commenter Name = ${populatedPost.comments[0].user.name}`)
    console.log('✅ POST & COMMENT CRUD Passed!\n')

    // Step 4: NOTIFICATION & CONNECTION PIPELINE
    console.log('[4/6] Testing Notification & Connection Pipeline...')
    
    // Create Mention Notification
    const mentionNotif = await Notification.create({
      user: userBeta._id,
      sender: userAlpha._id,
      type: 'mention',
      referenceId: createdPost._id,
      message: `@${userAlpha.username} mentioned you in a post`,
    })
    console.log(`  ✓ CREATE Notification: Mention notification generated for @${userBeta.username}`)

    // READ Notifications
    const betaNotifs = await Notification.find({ user: userBeta._id }).populate('sender', 'name username')
    console.log(`  ✓ READ Notifications: User Beta received ${betaNotifs.length} notification ("${betaNotifs[0].message}")`)

    // CREATE Connection (Follow)
    const connection = await Connection.create({
      user: userAlpha._id,
      connectedUser: userBeta._id,
    })
    console.log(`  ✓ CREATE Connection: User Alpha follows User Beta`)

    // READ Connections
    const following = await Connection.find({ user: userAlpha._id }).populate('connectedUser', 'name')
    console.log(`  ✓ READ Connections: User Alpha is following ${following[0].connectedUser.name}`)

    // DELETE Connection (Unfollow)
    await Connection.findByIdAndDelete(connection._id)
    console.log(`  ✓ DELETE Connection: User Alpha unfollowed User Beta`)
    console.log('✅ PIPELINE Test Passed!\n')

    // Step 5: DELETION & CLEANUP
    console.log('[5/6] Testing DELETION & Clean up...')
    
    // DELETE Post
    await Post.findByIdAndDelete(createdPost._id)
    await Notification.deleteMany({ referenceId: createdPost._id })
    console.log(`  ✓ DELETE Post: Removed test post & associated notifications`)

    // DELETE Users
    await User.findByIdAndDelete(userAlpha._id)
    await User.findByIdAndDelete(userBeta._id)
    await Notification.deleteMany({ user: { $in: [userAlpha._id, userBeta._id] } })
    console.log(`  ✓ DELETE Users: Removed test users from MongoDB Atlas`)
    console.log('✅ DELETION Test Passed!\n')

    console.log('====================================================')
    console.log('🎉 ALL CRUD & PIPELINE TESTS PASSED ON MONGODB ATLAS!')
    console.log('====================================================')
  } catch (error) {
    console.error('❌ Pipeline Test Failed:', error)
    // Cleanup if failed
    if (createdPost) await Post.findByIdAndDelete(createdPost._id).catch(() => {})
    if (userAlpha) await User.findByIdAndDelete(userAlpha._id).catch(() => {})
    if (userBeta) await User.findByIdAndDelete(userBeta._id).catch(() => {})
    process.exit(1)
  } finally {
    await mongoose.disconnect()
  }
}

runCrudPipelineTest()
