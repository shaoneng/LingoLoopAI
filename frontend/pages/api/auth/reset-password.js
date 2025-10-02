import { setCors } from '../../../lib/cors'
import { withTransaction } from '../../../lib/db'
import {
  consumePasswordResetToken,
  hashPassword,
  invalidatePasswordResetTokensForUser,
} from '../../../lib/auth'

function isStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8
}

async function handlePost(req, res) {
  const { token, newPassword } = req.body || {}
  if (!token || !isStrongEnough(newPassword)) {
    return res.status(400).json({ error: '请提供有效的重置 token 和至少 8 位的新密码。' })
  }

  const result = await withTransaction(async (client) => {
    const record = await consumePasswordResetToken({ token, client })
    if (!record) {
      return null
    }
    const passwordHash = hashPassword(newPassword)
    await client.query(
      'UPDATE "User" SET "passwordHash" = $1, "updatedAt" = NOW() WHERE "id" = $2',
      [passwordHash, record.userId]
    )
    await client.query('DELETE FROM "AuthSession" WHERE "userId" = $1', [record.userId])
    await invalidatePasswordResetTokensForUser({ userId: record.userId, client })
    return record
  })

  if (!result) {
    return res.status(400).json({ error: '重置链接无效或已过期，请重新申请。' })
  }

  return res.status(204).end()
}

export default async function handler(req, res) {
  setCors(req, res)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await handlePost(req, res)
  } catch (error) {
    console.error('reset-password handler error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器错误，请稍后再试。' })
    }
  }
}

