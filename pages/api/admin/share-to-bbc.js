import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { requireAuth } from '../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  let currentUser = null;
  try {
    const { user } = await requireAuth(req);
    currentUser = user;

    // Check if user is admin
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    const { title, description, externalUrl, bbcUrl, durationMs, transcript, licenseInfo } = req.body;

    if (!title) {
      return res.status(400).json({ error: '缺少 title' });
    }

    // Check if resource with same title already exists
    const existingShare = await prisma.sharedBbcResource.findFirst({
      where: { title }
    });

    if (existingShare) {
      return res.status(409).json({
        error: '该标题的资源已经在BBC资源库中',
        existingResource: {
          id: existingShare.id,
          title: existingShare.title,
          isPublished: existingShare.isPublished,
          createdAt: existingShare.createdAt
        }
      });
    }

    // Create shared BBC resource (metadata only)
    const sharedResource = await prisma.sharedBbcResource.create({
      data: {
        title,
        description: description || null,
        externalUrl: externalUrl || null,
        durationMs: durationMs || null,
        transcript: transcript || null,
        uploadedById: user.id,
        bbcUrl: bbcUrl || null,
        licenseInfo: licenseInfo || null,
        sourceType: licenseInfo ? 'cc_licensed' : 'external',
        isPublished: false, // Admin needs to manually publish
      }
    });

    return res.status(201).json({
      message: 'BBC资源已成功添加到资源库',
      resource: {
        id: sharedResource.id,
        title: sharedResource.title,
        description: sharedResource.description,
        durationMs: sharedResource.durationMs,
        externalUrl: sharedResource.externalUrl,
        transcript: sharedResource.transcript ? '有转写' : '无转写',
        sourceType: sharedResource.sourceType,
        isPublished: sharedResource.isPublished,
        createdAt: sharedResource.createdAt
      }
    });

  } catch (error) {
    console.error('Share to BBC library error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '添加到BBC资源库失败' });
  }
}