import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    if (req.method === 'POST') {
      return await handleCreate(req, res, user);
    } else if (req.method === 'GET') {
      return await handleList(req, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin shared resources error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}

async function handleCreate(req, res, user) {
  try {
    const { title, description, externalUrl, bbcUrl, durationMs, transcript, licenseInfo, episodeNumber, seasonNumber } = req.body;

    if (!title) {
      return res.status(400).json({ error: '缺少标题' });
    }

    // Create shared resource record (metadata only)
    const resource = await prisma.sharedBbcResource.create({
      data: {
        title,
        description: description || null,
        externalUrl: externalUrl || null,
        durationMs: durationMs ? parseInt(durationMs) : null,
        transcript: transcript || null,
        uploadedById: user.id,
        bbcUrl: bbcUrl || null,
        licenseInfo: licenseInfo || null,
        sourceType: licenseInfo ? 'cc_licensed' : 'external',
        episodeNumber: episodeNumber ? parseInt(episodeNumber) : null,
        seasonNumber: seasonNumber ? parseInt(seasonNumber) : null,
      },
    });

    return res.status(201).json({
      message: '资源创建成功',
      resource: {
        id: resource.id,
        title: resource.title,
        description: resource.description,
        externalUrl: resource.externalUrl,
        durationMs: resource.durationMs,
        transcript: resource.transcript ? '有转写' : '无转写',
        sourceType: resource.sourceType,
        episodeNumber: resource.episodeNumber,
        seasonNumber: resource.seasonNumber,
        bbcUrl: resource.bbcUrl,
        isPublished: resource.isPublished,
        createdAt: resource.createdAt,
      },
    });
  } catch (error) {
    console.error('Create resource error:', error);
    return res.status(500).json({ error: '创建资源失败' });
  }
}

async function handleList(req, res) {
  try {
    const resources = await prisma.sharedBbcResource.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: {
          select: { displayName: true, email: true },
        },
      },
    });

    // No BigInt conversion needed
    const serializedResources = resources;

    return res.status(200).json({ resources: serializedResources });
  } catch (error) {
    console.error('List resources error:', error);
    return res.status(500).json({ error: '获取资源列表失败' });
  }
}