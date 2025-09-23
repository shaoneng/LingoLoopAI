import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import {
  consumePasswordResetToken,
  hashPassword,
  invalidatePasswordResetTokensForUser,
} from '../../../lib/auth';

function isStrongEnough(password) {
  return typeof password === 'string' && password.length >= 8;
}

async function handlePost(req, res) {
  const { token, newPassword } = req.body || {};
  if (!token || !isStrongEnough(newPassword)) {
    return res.status(400).json({ error: '请提供有效的重置 token 和至少 8 位的新密码。' });
  }

  const result = await prisma.$transaction(async (tx) => {
    const record = await consumePasswordResetToken({ token, prismaClient: tx });
    if (!record) {
      return null;
    }
    const passwordHash = hashPassword(newPassword);
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.authSession.deleteMany({ where: { userId: record.userId } });
    await invalidatePasswordResetTokensForUser({ userId: record.userId, prismaClient: tx });
    return record;
  });

  if (!result) {
    return res.status(400).json({ error: '重置链接无效或已过期，请重新申请。' });
  }

  return res.status(204).end();
}

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await handlePost(req, res);
  } catch (error) {
    console.error('reset-password handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器错误，请稍后再试。' });
    }
  }
}
