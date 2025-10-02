export function applySelect(record, select) {
  if (!record || !select || typeof select !== 'object') {
    return record
  }

  const result = {}
  for (const [key, value] of Object.entries(select)) {
    if (!value) continue
    const current = record[key]
    if (value === true) {
      if (current !== undefined) {
        result[key] = current
      }
      continue
    }
    if (value && typeof value === 'object') {
      if (value.select && current) {
        result[key] = applySelect(current, value.select)
      } else {
        result[key] = current
      }
      continue
    }
  }
  return result
}

export function pickColumns(select) {
  if (!select || typeof select !== 'object') {
    return null
  }
  const columns = []
  for (const [key, value] of Object.entries(select)) {
    if (value === true) {
      columns.push(`"${key}"`)
    }
  }
  return columns.length ? columns : null
}

export function buildOrderBy(orderBy, allowedKeys, alias) {
  if (!orderBy) return ''
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy]
  const clauses = []
  for (const entry of entries) {
    const [key, direction] = Object.entries(entry || {})[0] || []
    if (!key || !allowedKeys.includes(key)) continue
    const dirString = (String(direction || 'asc').toUpperCase() === 'DESC') ? 'DESC' : 'ASC'
    const prefix = alias ? `${alias}.` : ''
    clauses.push(`${prefix}"${key}" ${dirString}`)
  }
  return clauses.length ? ` ORDER BY ${clauses.join(', ')}` : ''
}

export function buildPagination({ skip, take }) {
  let clause = ''
  if (Number.isInteger(take) && take >= 0) {
    clause += ` LIMIT ${Number(take)}`
  }
  if (Number.isInteger(skip) && skip > 0) {
    clause += ` OFFSET ${Number(skip)}`
  }
  return clause
}
