import { Pool } from 'pg'

let pool

function buildPool() {
  if (pool) return pool
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL environment variable.')
  }
  pool = new Pool({
    connectionString,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS || 10_000),
    ssl: connectionString.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  })
  pool.on('error', (err) => {
    console.error('Unexpected Postgres pool error', err)
  })
  return pool
}

export function getPool() {
  return buildPool()
}

export async function withClient(fn) {
  const client = await getPool().connect()
  try {
    return await fn(client)
  } finally {
    client.release()
  }
}

export async function withTransaction(fn) {
  return withClient(async (client) => {
    await client.query('BEGIN')
    try {
      const result = await fn(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined)
      throw error
    }
  })
}

export async function query(text, params) {
  const { rows } = await getPool().query(text, params)
  return rows
}

export async function runQuery(text, params = [], options = {}) {
  const client = options.client || options.prismaClient || null
  if (client) {
    const { rows } = await client.query(text, params)
    return rows
  }
  return query(text, params)
}
