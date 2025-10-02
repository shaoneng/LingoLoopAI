import { query } from '../client'
import { applySelect } from '../utils'

function buildWhereClause(where = {}, params = [], alias = 'a') {
  const clauses = []
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue
    if ((key === 'OR' || key === 'AND') && Array.isArray(value)) {
      const parts = value
        .map((item) => buildWhereClause(item, params, alias))
        .filter(Boolean)
      if (parts.length) {
        const joiner = key === 'AND' ? ' AND ' : ' OR '
        clauses.push(`(${parts.join(joiner)})`)
      }
      continue
    }
    if (value === null) {
      clauses.push(`${alias}."${key}" IS NULL`)
      continue
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.in) {
        const list = value.in
        if (!Array.isArray(list) || !list.length) {
          clauses.push('FALSE')
          continue
        }
        const placeholders = list.map((item) => {
          params.push(item)
          return `$${params.length}`
        })
        clauses.push(`${alias}."${key}" IN (${placeholders.join(', ')})`)
        continue
      }
      if (value.lte !== undefined) {
        params.push(value.lte)
        clauses.push(`${alias}."${key}" <= $${params.length}`)
        continue
      }
      if (value.gte !== undefined) {
        params.push(value.gte)
        clauses.push(`${alias}."${key}" >= $${params.length}`)
        continue
      }
    }
    params.push(value)
    clauses.push(`${alias}."${key}" = $${params.length}`)
  }
  return clauses.join(' AND ')
}

function buildOrderBy(orderBy) {
  if (!orderBy) return ''
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
  const parts = entries.map((entry) => {
    const [field, direction] = Object.entries(entry || {})[0] || []
    if (!field) return null
    const dir = String(direction || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
    return `a."${field}" ${dir}`
  }).filter(Boolean)
  return parts.length ? ` ORDER BY ${parts.join(', ')}` : ''
}

function buildSelect(select) {
  if (!select) return 'a.*'
  const columns = Object.entries(select)
    .filter(([, enabled]) => enabled === true)
    .map(([key]) => `a."${key}"`)
  return columns.length ? columns.join(', ') : 'a.*'
}

export async function findFirst(args = {}, client) {
  const { where = {}, orderBy, select } = args
  const params = []
  const whereClause = buildWhereClause(where, params)
  let sql = `SELECT ${buildSelect(select)} FROM "Analysis" a`
  if (whereClause) {
    sql += ` WHERE ${whereClause}`
  }
  sql += buildOrderBy(orderBy)
  sql += ' LIMIT 1'
  const { rows } = await query(sql, params, client)
  const row = rows[0] || null
  if (!row) return null
  if (select && Object.values(select).some((v) => typeof v === 'object')) {
    return applySelect(row, select)
  }
  return row
}

export async function findMany(args = {}, client) {
  const { where = {}, orderBy, take, skip, select } = args
  const params = []
  const whereClause = buildWhereClause(where, params)
  let sql = `SELECT ${buildSelect(select)} FROM "Analysis" a`
  if (whereClause) {
    sql += ` WHERE ${whereClause}`
  }
  sql += buildOrderBy(orderBy)
  if (Number.isInteger(take)) {
    sql += ` LIMIT ${take}`
  }
  if (Number.isInteger(skip) && skip > 0) {
    sql += ` OFFSET ${skip}`
  }
  const { rows } = await query(sql, params, client)
  if (select && Object.values(select).some((v) => typeof v === 'object')) {
    return rows.map((row) => applySelect(row, select))
  }
  return rows
}

export async function create({ data } = {}, client) {
  if (!data) throw new Error('Analysis.create requires data')
  const columns = []
  const placeholders = []
  const values = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    columns.push(`"${key}"`)
    values.push(value)
    placeholders.push(`$${values.length}`)
  }
  const sql = `INSERT INTO "Analysis" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0]
}

export async function update({ where = {}, data } = {}, client) {
  if (!data) throw new Error('Analysis.update requires data')
  const params = []
  const whereClause = buildWhereClause(where, params)
  if (!whereClause) {
    throw new Error('Analysis.update requires where clause')
  }
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    params.push(value)
    sets.push(`"${key}" = $${params.length}`)
  }
  sets.push('"updatedAt" = NOW()')
  const sql = `UPDATE "Analysis" SET ${sets.join(', ')} WHERE ${whereClause} RETURNING *`
  const { rows } = await query(sql, params, client)
  return rows[0] || null
}
