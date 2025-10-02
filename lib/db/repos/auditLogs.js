import { query } from '../client'

export async function create({ data } = {}, client) {
  if (!data) throw new Error('AuditLog.create requires data')
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
    throw new Error('AuditLog.create received empty data')
  }
  const sql = `INSERT INTO "AuditLog" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0]
}
