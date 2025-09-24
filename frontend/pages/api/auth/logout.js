import { setCors } from '../../../lib/cors';
import { revokeSessionByToken } from '../../../lib/auth';
import { AuditKinds, recordAuditLog } from '../../../lib/audit';

export default async function handler(req, res) {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { refreshToken } = req.body || {};
  const token = refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return res.status(400).json({ error: '缺少 refresh token。' });
  }

  try {
    await revokeSessionByToken({ token });
    recordAuditLog({
      kind: AuditKinds.LOGOUT,
      meta: { tokenTruncated: typeof token === 'string' ? `${token.slice(0, 6)}***` : null },
    }).catch(() => undefined);
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: '登出失败，请稍后再试。' });
  }
}
