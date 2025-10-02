import { query } from '../client'

function buildWhereClause(where = {}, params = [], alias = 'j') {
  const clauses = []
  for (const [key, value] of Object.entries(where)) {
    if (value === undefined) continue
    if ((key === 'OR' || key === 'AND') && Array.isArray(value)) {
      const orClauses = value
        .map((item) => buildWhereClause(item, params, alias))
        .filter(Boolean)
      if (orClauses.length) {
        const joiner = key === 'AND' ? ' AND ' : ' OR '
        clauses.push(`(${orClauses.join(joiner)})`)
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

function prepareInsert(data = {}) {
  const columns = []
  const placeholders = []
  const values = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    columns.push(`"${key}"`)
    values.push(value)
    placeholders.push(`$${values.length}`)
  }
  return { columns, placeholders, values }
}

function prepareUpdate(data = {}, params = []) {
  const sets = []
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue
    if (value && typeof value === 'object' && 'increment' in value) {
      const inc = Number(value.increment) || 0
      params.push(inc)
      sets.push(`"${key}" = "${key}" + $${params.length}`)
      continue
    }
    params.push(value)
    sets.push(`"${key}" = $${params.length}`)
  }
  sets.push('"updatedAt" = NOW()')
  return sets
}

export async function create({ data } = {}, client) {
  if (!data) throw new Error('Job.create requires data')
  const { columns, placeholders, values } = prepareInsert(data)
  const sql = `INSERT INTO "Job" (${columns.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`
  const { rows } = await query(sql, values, client)
  return rows[0]
}

export async function findFirst(args = {}, client) {
  const { where = {}, orderBy, select } = args
  const params = []
  const whereClause = buildWhereClause(where, params, 'j')
  let sql = 'SELECT j.* FROM "Job" j'
  if (whereClause) {
    sql += ` WHERE ${whereClause}`
  }
  if (orderBy) {
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
    const orderParts = entries.map((entry) => {
      const [field, direction] = Object.entries(entry || {})[0] || []
      if (!field) return null
      const dir = String(direction || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      return `j."${field}" ${dir}`
    }).filter(Boolean)
    if (orderParts.length) {
      sql += ` ORDER BY ${orderParts.join(', ')}`
    }
  }
  sql += ' LIMIT 1'
  const { rows } = await query(sql, params, client)
  let row = rows[0] || null
  if (!row) return null
  if (select) {
    row = Object.fromEntries(Object.entries(row).filter(([key]) => select[key]))
  }
  return row
}

export async function findMany(args = {}, client) {
  const { where = {}, orderBy, take, skip, select } = args
  const params = []
  const whereClause = buildWhereClause(where, params, 'j')
  let sql = 'SELECT j.* FROM "Job" j'
  if (whereClause) {
    sql += ` WHERE ${whereClause}`
  }
  if (orderBy) {
    const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
    const orderParts = entries.map((entry) => {
      const [field, direction] = Object.entries(entry || {})[0] || []
      if (!field) return null
      const dir = String(direction || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC'
      return `j."${field}" ${dir}`
    }).filter(Boolean)
    if (orderParts.length) {
      sql += ` ORDER BY ${orderParts.join(', ')}`
    }
  }
  if (Number.isInteger(take)) {
    sql += ` LIMIT ${take}`
  }
  if (Number.isInteger(skip) && skip > 0) {
    sql += ` OFFSET ${skip}`
  }
  const { rows } = await query(sql, params, client)
  if (!select) return rows
  return rows.map((row) => Object.fromEntries(Object.entries(row).filter(([key]) => select[key])))
}

export async function findUnique({ where = {}, select } = {}, client) {
  const params = []
  const whereClause = buildWhereClause(where, params, 'j')
  if (!whereClause) {
    throw new Error('Job.findUnique requires unique where clause')
  }
  let sql = 'SELECT j.* FROM "Job" j'
  sql += ` WHERE ${whereClause} LIMIT 1`
  const { rows } = await query(sql, params, client)
  let row = rows[0] || null
  if (!row) return null
  if (select) {
    row = Object.fromEntries(Object.entries(row).filter(([key]) => select[key]))
  }
  return row
}

export async function update({ where = {}, data } = {}, client) {
  if (!data) throw new Error('Job.update requires data')
  const params = []
  const whereClause = buildWhereClause(where, params, 'j')
  if (!whereClause) {
    throw new Error('Job.update requires where clause')
  }
  const sets = prepareUpdate(data, params)
  const sql = `UPDATE "Job" SET ${sets.join(', ')} WHERE ${whereClause} RETURNING *`
  const { rows } = await query(sql, params, client)
  return rows[0] || null
}
