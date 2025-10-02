import { query } from '../client'

function buildWhereClause(where = {}) {
  const clauses = []
  const values = []
  if (where.id) {
    values.push(where.id)
    clauses.push(`"id" = $${values.length}`)
  }
  if (where.userId_day) {
    const { userId, day } = where.userId_day
    if (!userId || !day) {
      throw new Error('UsageLog.where.userId_day requires userId and day')
    }
    values.push(userId)
    clauses.push(`"userId" = $${values.length}`)
    values.push(day)
    clauses.push(`"day" = $${values.length}`)
  }
  if (!clauses.length) {
    throw new Error('UsageLog.where requires id or userId_day')
  }
  return { clauses, values }
}

export async function findUnique({ where } = {}, client) {
  const { clauses, values } = buildWhereClause(where)
  const sql = `SELECT * FROM "UsageLog" WHERE ${clauses.join(' AND ')} LIMIT 1`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}

export async function upsert({ where, create, update } = {}, client) {
  if (!where?.userId_day) {
    throw new Error('UsageLog.upsert currently supports userId_day unique constraint only')
  }
  const { userId, day } = where.userId_day
  if (!userId || !day) {
    throw new Error('UsageLog.upsert requires userId and day')
  }

  const insertColumns = ['"userId"', '"day"']
  const insertValues = [userId, day]
  const placeholders = [`$${insertValues.length - 1}`, `$${insertValues.length}`]

  for (const [key, value] of Object.entries(create || {})) {
    if (value === undefined || key === 'userId' || key === 'day') continue
    insertColumns.push(`"${key}"`)
    insertValues.push(value)
    placeholders.push(`$${insertValues.length}`)
  }

  const hasUpdate = update && Object.keys(update).length > 0
  let sql
  if (hasUpdate) {
    const updateSets = []
    const updateValues = []
    for (const [key, value] of Object.entries(update)) {
      if (value === undefined) continue
      updateValues.push(value)
      updateSets.push(`"${key}" = $${insertValues.length + updateValues.length}`)
    }
    updateSets.push('"updatedAt" = NOW()')
    sql = `INSERT INTO "UsageLog" (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')}) ` +
      `ON CONFLICT ("userId", "day") DO UPDATE SET ${updateSets.join(', ')} RETURNING *`
    const { rows } = await query(sql, [...insertValues, ...updateValues], client)
    return rows[0]
  }

  sql = `INSERT INTO "UsageLog" (${insertColumns.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT ("userId", "day") DO NOTHING RETURNING *`
  const { rows } = await query(sql, insertValues, client)
  if (rows[0]) {
    return rows[0]
  }
  return findUnique({ where }, client)
}

export async function update({ where, data } = {}, client) {
  if (!data) throw new Error('UsageLog.update requires data')
  const { clauses, values } = buildWhereClause(where)
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    values.push(value)
    sets.push(`"${key}" = $${values.length}`)
  }
  sets.push('"updatedAt" = NOW()')
  const sql = `UPDATE "UsageLog" SET ${sets.join(', ')} WHERE ${clauses.join(' AND ')} RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0] || null
}
