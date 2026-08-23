import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import { connectDatabase } from './config/db.js'
import { connectPostgres } from './config/pgDb.js'
import authRoutes from './routes/authRoutes.js'
import postRoutes from './routes/postRoutes.js'
import storyRoutes from './routes/storyRoutes.js'
import messageRoutes from './routes/messageRoutes.js'
import Story from './models/Story.js'

process.on('uncaughtException', (err) => console.error('Uncaught Error:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const app = express()
app.set('trust proxy', 1)
const port = process.env.PORT || 5000

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
const defaultProductionOrigins = ['https://devgram-sandy.vercel.app', 'https://anilkumarmaripi.github.io']
const envOrigins = (process.env.CLIENT_URL || process.env.CLIENT_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

const allowedOrigins = Array.from(new Set([...defaultProductionOrigins, ...envOrigins]))

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)

      const normalizedOrigin = origin.replace(/\/$/, '')

      if (localDevOriginPattern.test(normalizedOrigin)) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true)
      } else {
        return callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204,
  }),
)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

app.get('/', (_request, response) => {
  response.send('🚀 DevGram API is online and running successfully!')
})

app.get('/api/health', (_request, response) => {
  const isConnected = mongoose.connection.readyState === 1
  response.json({
    status: isConnected ? 'ok' : 'degraded',
    service: 'devgram-api',
    database: isConnected ? 'connected' : 'disconnected',
    readyState: mongoose.connection.readyState
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/stories', storyRoutes)
app.use('/api/messages', messageRoutes)

try {
  await connectDatabase()
  await connectPostgres()
} catch (dbErr) {
  console.error('⚠️ Database initialization notice:', dbErr.message)
}

// Scheduled 24h story cleanup task (purges expired stories every hour)
const purgeExpiredStories = async () => {
  if (mongoose.connection.readyState !== 1) return
  try {
    const res = await Story.deleteMany({ expiresAt: { $lte: new Date() } })
    if (res.deletedCount > 0) {
      console.log(`🧹 Purged ${res.deletedCount} expired stories.`)
    }
  } catch (err) {
    console.error('Expired stories cleanup error:', err.message)
  }
}

if (mongoose.connection.readyState === 1) {
  purgeExpiredStories()
  setInterval(purgeExpiredStories, 60 * 60 * 1000)
}

app.listen(port, () => {
  console.log(`DevGram API running on http://localhost:${port}`)
})
