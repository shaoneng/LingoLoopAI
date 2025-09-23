import { setCors } from '../../../../lib/cors';
import prisma from '../../../../lib/prisma';
import { requireAuth, enforceSoftDelete } from '../../../../lib/middleware/auth';
import { generateV4SignedUrl, parseGcsUri, requireBucketName } from '../../../../lib/uploads';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { user } = await requireAuth(req);
    const audioId = req.query?.audioId;
    if (!audioId || typeof audioId !== 'string') {
      return res.status(400).json({ error: '缺少有效的 audioId。' });
    }

    const audio = await prisma.audioFile.findFirst({
      where: { id: audioId, userId: user.id },
    });
    enforceSoftDelete(audio, '音频不存在或已删除。');
    if (!audio.gcsUri) {
      return res.status(400).json({ error: '音频尚未完成上传。' });
    }

    const parsed = parseGcsUri(audio.gcsUri);
    if (!parsed) {
      return res.status(400).json({ error: '音频存储路径异常。' });
    }
    const bucketName = requireBucketName();
    if (parsed.bucket !== bucketName) {
      return res.status(400).json({ error: '音频存储桶不匹配。' });
    }

    const expires = Number(req.query?.expires) || 600;
    const signedUrl = await generateV4SignedUrl({ bucketName, objectKey: parsed.key, expiresInSeconds: expires });

    res.status(200).json({ signedUrl, expiresIn: expires });
  } catch (error) {
    if (error?.statusCode) {
      return res.status(error.statusCode).json({ error: error.message || '请求失败' });
    }
    console.error('Generate signed URL error:', error);
    return res.status(500).json({ error: '获取音频播放地址失败，请稍后再试。' });
  }
}
