import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL

  if (!uri) {
    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.error('❌ CRITICAL CONFIGURATION ERROR: No MongoDB connection string provided in environment variables!')
      console.error('👉 Please set MONGO_URI (or MONGODB_URI) in your Render environment settings.')
    }
  }

  const targetUri = uri || 'mongodb://127.0.0.1:27017/devgram'

  try {
    await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 5000 })
    const sanitizedUri = targetUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
    console.log(`✅ MongoDB connected successfully (${sanitizedUri})`)
  } catch (err) {
    const sanitizedUri = targetUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
    console.warn(`⚠️ Primary MongoDB connection failed for ${sanitizedUri} (${err.message})`)

    if (process.env.NODE_ENV === 'production' || process.env.RENDER) {
      console.error('❌ Production database connection failed. Ensure 0.0.0.0/0 is added to MongoDB Atlas Network Access.')
      return
    }

    console.log('🔄 Attempting to spin up In-Memory MongoDB server for local development...')
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server')
      const mongoServer = await MongoMemoryServer.create()
      const mongoUri = mongoServer.getUri()
      await mongoose.connect(mongoUri)
      console.log(`✅ In-Memory MongoDB server connected successfully (${mongoUri})`)
    } catch (memErr) {
      console.error(`❌ Could not start In-Memory MongoDB fallback: ${memErr.message}`)
    }
  }
}
