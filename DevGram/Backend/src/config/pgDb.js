import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432', 10),
      database: process.env.PGDATABASE || 'postgres',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    }

export const pgPool = new Pool({
  ...poolConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
})

export async function connectPostgres() {
  try {
    const client = await pgPool.connect()
    console.log('✅ PostgreSQL database connected successfully!')

    // Auto-initialize schema if needed
    try {
      const schemaPath = path.join(__dirname, '../../schema.sql')
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8')
        await client.query(sql)
        console.log('⚡ DevGram PostgreSQL database schema initialized successfully!')
      }
    } catch (schemaErr) {
      console.warn('⚠️ PostgreSQL Schema initialization notice:', schemaErr.message)
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('❌ PostgreSQL Connection Error:', err.message)
    console.warn('💡 Tip: Verify PostgreSQL service is running on localhost:5432 with credentials matching .env')
  }
}

export function query(text, params) {
  return pgPool.query(text, params)
}
