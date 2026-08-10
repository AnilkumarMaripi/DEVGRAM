import cookieParser from 'cookie-parser'
import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import { connectDatabase } from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import postRoutes from './routes/postRoutes.js'

process.on('uncaughtException', (err) => console.error('Uncaught Error:', err));
process.on('unhandledRejection', (reason) => console.error('Unhandled Rejection:', reason));

const app = express()
const port = process.env.PORT || 5000

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean)

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
  response.json({ status: 'ok', service: 'devgram-api', database: 'mongodb' })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

await connectDatabase()

app.listen(port, () => {
  console.log(`DevGram API running on http://localhost:${port}`)
})
