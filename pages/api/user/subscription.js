import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);

    if (req.method === 'GET') {
      return await handleGet(req, res, user);
    } else if (req.method === 'POST') {
      return await handleCreate(req, res, user);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Subscription error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}

async function handleGet(req, res, user) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    return res.status(200).json({ subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    return res.status(500).json({ error: '获取订阅信息失败' });
  }
}

async function handleCreate(req, res, user) {
  try {
    const { planType = 'monthly' } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (existingSubscription && existingSubscription.status === 'ACTIVE') {
      if (new Date(existingSubscription.expiresAt) > new Date()) {
        return res.status(400).json({ error: '您已有活跃的订阅' });
      }
    }

    // Calculate expiration date (1 month from now for monthly)
    const startedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Create or update subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        status: 'ACTIVE',
        planType,
        startedAt,
        expiresAt,
        cancelledAt: null,
      },
      create: {
        userId: user.id,
        status: 'ACTIVE',
        planType,
        startedAt,
        expiresAt,
      },
    });

    return res.status(201).json({
      message: '订阅成功',
      subscription,
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    return res.status(500).json({ error: '创建订阅失败' });
  }
}