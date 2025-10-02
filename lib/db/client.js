import { Pool, types } from 'pg'

types.setTypeParser(20, (value) => (value == null ? null : BigInt(value)))
types.setTypeParser(1700, (value) => (value == null ? null : Number(value)))

let pool

function createPool() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL is not configured')
  }

  const config = {
    connectionString: url,
    max: Number(process.env.DB_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 30_000),
  }

  const disableSsl = process.env.DB_SSL_DISABLE === '1'
  const shouldUseSsl = !disableSsl && !/localhost|127\.0\.0\.1/.test(url)
  if (shouldUseSsl) {
    config.ssl = { rejectUnauthorized: false }
  }

  return new Pool(config)
}

function getPool() {
  if (!pool) {
    pool = createPool()
    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error', error)
    })
  }
  return pool
}

export async function query(text, params = [], client) {
  const executor = client || getPool()
  return executor.query(text, params)
}

export async function withConnection(fn) {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function withTransaction(fn) {
  return withConnection(async (client) => {
    try {
      await client.query('BEGIN')
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Failed to rollback transaction', rollbackError)
      }
      throw error
    }
  })
}

export function mapRow(row) {
  if (!row || typeof row !== 'object') {
    return row
  }

  const mapped = {}
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === 'bigint') {
      mapped[key] = value
    } else {
      mapped[key] = value
    }
  }
  return mapped
}

export function mapRows(rows) {
  return rows.map((row) => mapRow(row))
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
