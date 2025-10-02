import { query } from '../client'
import { applySelect, pickColumns } from '../utils'

function buildWhereClause(where = {}) {
  const clauses = []
  const values = []
  if (where.id) {
    values.push(where.id)
    clauses.push(`"id" = $${values.length}`)
  }
  if (where.email) {
    values.push(where.email)
    clauses.push(`LOWER("email") = LOWER($${values.length})`)
  }
  if (!clauses.length) {
    throw new Error('User.where requires id or email')
  }
  return { clauses, values }
}

export async function findUnique(args = {}, client) {
  const { where = {}, select } = args
  const { clauses, values } = buildWhereClause(where)
  const columns = pickColumns(select)
  const columnSql = columns ? columns.join(', ') : '*'
  const sql = `SELECT ${columnSql} FROM "User" WHERE ${clauses.join(' AND ')} LIMIT 1`
  const { rows } = await query(sql, values, client)
  const row = rows[0] || null
  if (!row) return null
  return select ? applySelect(row, select) : row
}

export async function create({ data } = {}, client) {
  if (!data) throw new Error('User.create requires data')
  const columns = []
  const placeholders = []
  const values = []

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    columns.push(`"${key}"`)
    values.push(value)
    placeholders.push(`$${values.length}`)
  }

  if (!columns.length) {
    throw new Error('User.create received empty data')
  }

  const sql = `INSERT INTO "User" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0]
}

export async function update({ where = {}, data } = {}, client) {
  if (!data) throw new Error('User.update requires data')
  const { clauses, values } = buildWhereClause(where)
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    sets.push(`"${key}" = $${values.length}`)
  }
  sets.push('"updatedAt" = NOW()')
  const sql = `UPDATE "User" SET ${sets.join(', ')} WHERE ${clauses.join(' AND ')} RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}
