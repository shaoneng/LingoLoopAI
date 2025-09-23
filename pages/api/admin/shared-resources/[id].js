import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth } from '../../../../lib/middleware/auth';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const { user } = await requireAuth(req);
    const resourceId = req.query.id;

    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    if (req.method === 'PATCH') {
      return await handleUpdate(req, res, resourceId);
    } else if (req.method === 'DELETE') {
      return await handleDelete(req, res, resourceId);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin resource management error:', error);
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return res.status(500).json({ error: '服务器错误' });
  }
}

async function handleUpdate(req, res, resourceId) {
  try {
    const { isPublished, title, description, episodeNumber, seasonNumber, bbcUrl } = req.body;

    const resource = await prisma.sharedBbcResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }

    const updateData = {};
    if (typeof isPublished === 'boolean') {
      updateData.isPublished = isPublished;
      updateData.publishDate = isPublished ? new Date() : null;
    }
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (episodeNumber !== undefined) updateData.episodeNumber = episodeNumber ? parseInt(episodeNumber) : null;
    if (seasonNumber !== undefined) updateData.seasonNumber = seasonNumber ? parseInt(seasonNumber) : null;
    if (bbcUrl !== undefined) updateData.bbcUrl = bbcUrl;

    const updatedResource = await prisma.sharedBbcResource.update({
      where: { id: resourceId },
      data: updateData,
      include: {
        uploadedBy: {
          select: {
            id: true,
            displayName: true,
            email: true,
          }
        }
      }
    });

    // Convert BigInt fields to numbers for JSON serialization
    const serializedResource = {
      id: updatedResource.id,
      title: updatedResource.title,
      description: updatedResource.description,
      audioUrl: updatedResource.audioUrl,
      durationMs: updatedResource.durationMs,
      sizeBytes: Number(updatedResource.sizeBytes || 0),
      transcript: updatedResource.transcript,
      segments: updatedResource.segments,
      uploadedById: updatedResource.uploadedById,
      uploadedBy: updatedResource.uploadedBy,
      isPublished: updatedResource.isPublished,
      publishDate: updatedResource.publishDate,
      episodeNumber: updatedResource.episodeNumber,
      seasonNumber: updatedResource.seasonNumber,
      bbcUrl: updatedResource.bbcUrl,
      createdAt: updatedResource.createdAt,
      updatedAt: updatedResource.updatedAt,
    };

    return res.status(200).json({
      message: '资源更新成功',
      resource: serializedResource,
    });
  } catch (error) {
    console.error('Update resource error:', error);
    return res.status(500).json({ error: '更新失败' });
  }
}

async function handleDelete(req, res, resourceId) {
  try {
    const resource = await prisma.sharedBbcResource.findUnique({
      where: { id: resourceId },
    });

    if (!resource) {
      return res.status(404).json({ error: '资源不存在' });
    }

    await prisma.sharedBbcResource.delete({
      where: { id: resourceId },
    });

    return res.status(200).json({
      message: '资源删除成功',
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    return res.status(500).json({ error: '删除失败' });
  }
}