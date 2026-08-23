import mongoose from 'mongoose'

// Configure Mongoose connection event listeners
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose connection event: Connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection event: Error:', err.message)
})

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Mongoose connection event: Disconnected from MongoDB')
})

mongoose.connection.on('reconnected', () => {
  console.log('🔄 Mongoose connection event: Reconnected to MongoDB')
})

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL

  if (!uri) {
    console.warn('⚠️ No MONGO_URI provided in environment. Defaulting to local MongoDB / In-Memory server.')
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/devgram'
  const sanitizedUri = targetUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')

  try {
    console.log(`🔌 Connecting to MongoDB at ${sanitizedUri}...`)
    await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Disable buffering so failed DB connections throw immediately instead of hanging 10000ms
    })
    console.log(`✅ MongoDB primary connection established successfully (${sanitizedUri})`)
    return
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed for ${sanitizedUri}: ${err.message}`)
  }

  // Fallback: Attempt In-Memory MongoDB server for local development or missing URI
  console.log('🔄 Attempting In-Memory MongoDB server fallback...')
  try {
    const { MongoMemoryServer } = await import('mongodb-memory-server')
    const mongoServer = await MongoMemoryServer.create()
    const mongoUri = mongoServer.getUri()
    await mongoose.connect(mongoUri, { bufferCommands: false })
    console.log(`✅ In-Memory MongoDB server connected successfully (${mongoUri})`)
  } catch (memErr) {
    console.error(`❌ In-Memory MongoDB fallback failed: ${memErr.message}`)
    if (mongoose.connection.readyState !== 1) {
      throw new Error(`Database connection failed completely. Ensure MONGO_URI is set or MongoDB Atlas IP whitelist (0.0.0.0/0) is configured. Error: ${memErr.message}`)
    }
  }
}
