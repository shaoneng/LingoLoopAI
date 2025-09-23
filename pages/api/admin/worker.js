import { setCors } from '../../../lib/cors';
import { startWorker, stopWorker, getWorkerStatus } from '../../../lib/worker';
import { requireAuth } from '../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    // Only allow admins to control worker
    const user = await requireAuth(req);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    switch (req.method) {
      case 'POST':
        await startWorker();
        return res.json({ message: '工作器已启动', status: getWorkerStatus() });

      case 'DELETE':
        await stopWorker();
        return res.json({ message: '工作器已停止', status: getWorkerStatus() });

      case 'GET':
        return res.json({ status: getWorkerStatus() });

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Worker API error:', error);
    return res.status(500).json({ error: error.message || '服务器错误' });
  }
}