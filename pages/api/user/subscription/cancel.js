import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user } = await requireAuth(req);

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      return res.status(404).json({ error: '订阅不存在' });
    }

    if (subscription.status !== 'ACTIVE') {
      return res.status(400).json({ error: '订阅不处于活跃状态' });
    }

    // Mark subscription as cancelled but still valid until expiry
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: user.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return res.status(200).json({
      message: '订阅已取消',
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}