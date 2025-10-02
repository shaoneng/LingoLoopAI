import { query } from '../client'

function buildWhereClause(where = {}) {
  const clauses = []
  const values = []
  if (where.id) {
    values.push(where.id)
    clauses.push(`"id" = $${values.length}`)
  }
  if (where.userId) {
    values.push(where.userId)
    clauses.push(`"userId" = $${values.length}`)
  }
  if (!clauses.length) {
    throw new Error('Subscription.where requires id or userId')
  }
  return { clauses, values }
}

export async function findUnique({ where } = {}, client) {
  const { clauses, values } = buildWhereClause(where)
  const sql = `SELECT * FROM "Subscription" WHERE ${clauses.join(' AND ')} LIMIT 1`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}

export async function update({ where, data } = {}, client) {
  if (!data) throw new Error('Subscription.update requires data')
  const { clauses, values } = buildWhereClause(where)
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    sets.push(`"${key}" = $${values.length}`)
  }
  sets.push('"updatedAt" = NOW()')
  const sql = `UPDATE "Subscription" SET ${sets.join(', ')} WHERE ${clauses.join(' AND ')} RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}

export async function upsert({ where, create, update: updateData } = {}, client) {
  if (!where?.userId) {
    throw new Error('Subscription.upsert currently supports userId unique constraint only')
  }
  const userId = where.userId
  const insertColumns = ['"userId"']
  const insertValues = [userId]
  const placeholders = ['$1']

  const additionalCreate = create || {}
  const values = [...insertValues]
  for (const [key, value] of Object.entries(additionalCreate)) {
    if (value === undefined || key === 'userId') continue
    values.push(value)
    insertColumns.push(`"${key}"`)
    placeholders.push(`$${values.length}`)
  }

  const updateSets = []
  const updateValues = []
  for (const [key, value] of Object.entries(updateData || {})) {
    if (value === undefined) continue
    updateValues.push(value)
    updateSets.push(`"${key}" = $${values.length + updateValues.length}`)
  }
  updateSets.push('"updatedAt" = NOW()')

  const sql = `INSERT INTO "Subscription" (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')}) ` +
    `ON CONFLICT ("userId") DO UPDATE SET ${updateSets.join(', ')} RETURNING *`
  const { rows } = await query(sql, [...values, ...updateValues], client)
  return rows[0]
}
