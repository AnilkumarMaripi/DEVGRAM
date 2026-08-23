import mongoose from 'mongoose'
import User from '../src/models/User.js'
import Post from '../src/models/Post.js'
import Story from '../src/models/Story.js'
import { pgPool } from '../src/config/pgDb.js'

const mongoUri = 'mongodb+srv://anilmaripi143_db_user:rmAOq0h20WCf5jW2@cluster0.tievxbz.mongodb.net/DevGram?retryWrites=true&w=majority&appName=Cluster0'

async function checkAndMigrate() {
  try {
    await mongoose.connect(mongoUri)
    console.log('✅ MongoDB connected.')

    const mongoUsers = await User.find({})
    console.log(`📌 Found ${mongoUsers.length} users in MongoDB:`)
    console.log(JSON.stringify(mongoUsers.map(u => ({ id: u._id.toString(), name: u.name, username: u.username, email: u.email, bio: u.bio, avatar: u.avatar })), null, 2))

    // Also check PostgreSQL users
    const pgRes = await pgPool.query('SELECT id, username, email, account_type FROM users')
    console.log(`📌 Found ${pgRes.rows.length} users in PostgreSQL:`)
    console.log(pgRes.rows)

    process.exit(0)
  } catch (err) {
    console.error('Error:', err)
    process.exit(1)
  }
}

checkAndMigrate()
