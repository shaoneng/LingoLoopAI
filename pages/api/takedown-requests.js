import { setCors } from '../../lib/cors';
import { requireAuth } from '../../lib/middleware/auth';
import {
  findSharedResourceById,
  createTakedownRequest,
  listTakedownRequests,
} from '../../lib/supabase/takedownRequests';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    return await handleTakedownRequest(req, res);
  } else if (req.method === 'GET') {
    return await handleListRequests(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleTakedownRequest(req, res) {
  try {
    const { resourceId, reason, contactInfo, additionalInfo } = req.body;

    if (!resourceId || !reason || !contactInfo) {
      return res.status(400).json({
        error: '缺少必要字段：resourceId, reason, contactInfo'
      });
    }

    // Verify the resource exists
    const resource = await findSharedResourceById(resourceId);

    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }

    // Create takedown request
    const takedownRequest = await createTakedownRequest({
      resourceId,
      reason,
      contactInfo,
      additionalInfo,
    });

    // Log the takedown request
    console.log(`Takedown request created for resource ${resourceId}:`, {
      id: takedownRequest.id,
      reason,
      contactInfo
    });

    return res.status(201).json({
      message: '下架请求已提交，我们将在24小时内处理',
      request: {
        id: takedownRequest.id,
        status: takedownRequest.status,
        createdAt: takedownRequest.createdAt
      }
    });

  } catch (error) {
    console.error('Takedown request error:', error);
    return res.status(500).json({ error: '提交下架请求失败' });
  }
}

async function handleListRequests(req, res) {
  try {
    const { user } = await requireAuth(req);

    // Only admins can view takedown requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const requests = await listTakedownRequests();

    return res.status(200).json({ requests });

  } catch (error) {
    console.error('List takedown requests error:', error);
    return res.status(500).json({ error: '获取下架请求列表失败' });
  }
}
