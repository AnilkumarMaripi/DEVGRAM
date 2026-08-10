import mongoose from 'mongoose'

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/devgram'

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 })
    const sanitizedUri = uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')
    console.log(`✅ MongoDB connected successfully (${sanitizedUri})`)
  } catch (err) {
    console.warn(`⚠️ Primary MongoDB connection failed (${err.message})`)
    console.log('🔄 Attempting to spin up In-Memory MongoDB server for instant zero-config operations...')
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server')
      const mongoServer = await MongoMemoryServer.create()
      const mongoUri = mongoServer.getUri()
      await mongoose.connect(mongoUri)
      console.log(`✅ In-Memory MongoDB server started and connected successfully (${mongoUri})`)
    } catch (memErr) {
      console.error(`❌ Could not start In-Memory MongoDB fallback: ${memErr.message}`)
    }
  }
}
