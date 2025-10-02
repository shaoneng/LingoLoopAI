import { query } from '../client'
import { applySelect } from '../utils'
import { findUnique as findUser } from './users'

function buildWhereClause(where = {}) {
  const clauses = []
  const values = []
  if (where.id) {
    values.push(where.id)
    clauses.push(`"id" = $${values.length}`)
  }
  if (where.tokenHash) {
    values.push(where.tokenHash)
    clauses.push(`"tokenHash" = $${values.length}`)
  }
  if (where.userId) {
    values.push(where.userId)
    clauses.push(`"userId" = $${values.length}`)
  }
  if (!clauses.length) {
    throw new Error('PasswordResetToken.where requires id, tokenHash, or userId')
  }
  return { clauses, values }
}

export async function create({ data } = {}, client) {
  if (!data) throw new Error('PasswordResetToken.create requires data')
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
    throw new Error('PasswordResetToken.create received empty data')
  }
  const sql = `INSERT INTO "PasswordResetToken" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0]
}

export async function findUnique(args = {}, client) {
  const { where = {}, include } = args
  const { clauses, values } = buildWhereClause(where)
  const sql = `SELECT * FROM "PasswordResetToken" WHERE ${clauses.join(' AND ')} LIMIT 1`
  const { rows } = await query(sql, values, client)
  const row = rows[0] || null
  if (!row) return null
  if (include?.user) {
    row.user = await findUser({ where: { id: row.userId } }, client)
    if (include.user.select) {
      row.user = applySelect(row.user, include.user.select)
    }
  }
  return row
}

export async function update({ where = {}, data } = {}, client) {
  if (!data) throw new Error('PasswordResetToken.update requires data')
  const { clauses, values } = buildWhereClause(where)
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    sets.push(`"${key}" = $${values.length}`)
  }
  if (!sets.length) {
    throw new Error('PasswordResetToken.update received empty data')
  }
  const sql = `UPDATE "PasswordResetToken" SET ${sets.join(', ')} WHERE ${clauses.join(' AND ')} RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}

export async function updateMany({ where = {}, data } = {}, client) {
  if (!data) throw new Error('PasswordResetToken.updateMany requires data')
  const { clauses, values } = buildWhereClause(where)
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    sets.push(`"${key}" = $${values.length}`)
  }
  if (!sets.length) {
    throw new Error('PasswordResetToken.updateMany received empty data')
  }
  const sql = `UPDATE "PasswordResetToken" SET ${sets.join(', ')} WHERE ${clauses.join(' AND ')}`
  const result = await query(sql, values, client)
  return { count: result.rowCount }
}
