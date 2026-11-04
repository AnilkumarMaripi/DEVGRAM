import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pgPool } from './pgDb.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const migrationsDir = path.resolve(__dirname, '../../migrations')

/**
 * Executes Flyway SQL migrations in order, tracking them in flyway_schema_history.
 */
export async function runFlywayMigrations() {
  let client
  try {
    client = await pgPool.connect()
  } catch (err) {
    console.warn('⚠️ Could not connect to PostgreSQL for Flyway migrations:', err.message)
    return
  }

  try {
    // 1. Ensure Flyway schema history table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS flyway_schema_history (
          installed_rank INT NOT NULL,
          version VARCHAR(50),
          description VARCHAR(200) NOT NULL,
          type VARCHAR(20) NOT NULL,
          script VARCHAR(1000) NOT NULL,
          checksum INT,
          installed_by VARCHAR(100) NOT NULL,
          installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          execution_time INT NOT NULL,
          success BOOLEAN NOT NULL,
          CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank)
      );
    `)

    // 2. Fetch applied migration versions
    const historyRes = await client.query(
      `SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank ASC`
    )
    const appliedVersions = new Set(historyRes.rows.map((row) => row.version))

    // 3. Read migration files from migrations folder
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found.')
      return
    }

    const files = fs.readdirSync(migrationsDir)
      .filter((file) => /^V\d+__.+\.sql$/.test(file))
      .sort((a, b) => {
        const vA = parseInt(a.slice(1).split('__')[0], 10)
        const vB = parseInt(b.slice(1).split('__')[0], 10)
        return vA - vB
      })

    let rankRes = await client.query(`SELECT COALESCE(MAX(installed_rank), 0) AS max_rank FROM flyway_schema_history`)
    let currentRank = parseInt(rankRes.rows[0].max_rank, 10)

    for (const file of files) {
      const match = file.match(/^V(\d+)__(.+)\.sql$/)
      if (!match) continue

      const version = match[1]
      const description = match[2].replace(/_/g, ' ')

      if (appliedVersions.has(version)) {
        continue
      }

      console.log(`🚀 Applying Flyway migration V${version} (${description})...`)
      const startTime = Date.now()
      const sqlContent = fs.readFileSync(path.join(migrationsDir, file), 'utf8')

      try {
        await client.query('BEGIN')
        await client.query(sqlContent)
        const duration = Date.now() - startTime
        currentRank += 1

        await client.query(
          `INSERT INTO flyway_schema_history 
           (installed_rank, version, description, type, script, checksum, installed_by, execution_time, success)
           VALUES ($1, $2, $3, 'SQL', $4, null, 'devgram', $5, true)`,
          [currentRank, version, description, file, duration]
        )
        await client.query('COMMIT')
        console.log(`✅ Flyway migration V${version} applied successfully in ${duration}ms.`)
      } catch (migrationErr) {
        await client.query('ROLLBACK')
        console.error(`❌ Migration V${version} failed:`, migrationErr.message)
        throw migrationErr
      }
    }
  } catch (err) {
    console.error('⚠️ Flyway migration error:', err.message)
  } finally {
    if (client) client.release()
  }
}

