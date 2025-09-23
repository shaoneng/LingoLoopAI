import { setCors } from '../../../lib/cors';
import prisma from '../../../lib/prisma';
import { createPasswordResetToken } from '../../../lib/auth';
import { sendMail } from '../../../lib/mailer';

function normalizeEmail(email) {
  return email?.toString().trim().toLowerCase();
}

function buildResetUrl(req, token) {
  const configuredBase = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL;
  const base = configuredBase || inferBaseFromRequest(req);
  if (!base) {
    throw new Error('APP_BASE_URL is not configured.');
  }
  const url = new URL(base);
  url.pathname = '/reset-password';
  url.searchParams.set('token', token);
  return url.toString();
}

function inferBaseFromRequest(req) {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return null;
  return `${proto}://${host}`;
}

async function handlePost(req, res) {
  if (!process.env.AUTH_JWT_SECRET) {
    return res.status(500).json({ error: 'AUTH_JWT_SECRET is not configured.' });
  }

  const normalizedEmail = normalizeEmail(req.body?.email);
  if (!normalizedEmail) {
    return res.status(400).json({ error: '请输入邮箱地址。' });
  }

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(204).end();
  }

  try {
    const { token } = await createPasswordResetToken({ userId: user.id });
    const resetUrl = buildResetUrl(req, token);
    const subject = '重置你的 LingoLoop 账户密码';
    const text = `你好 ${user.displayName || ''}\n\n请点击以下链接以重置密码（30 分钟内有效）：\n${resetUrl}\n\n如果这不是你的操作，请忽略本邮件。`;
    const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;">` +
      `<p>你好${user.displayName ? ` ${user.displayName}` : ''}，</p>` +
      '<p>请点击下面的按钮以重置密码（30 分钟内有效）：</p>' +
      `<p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;">重置密码</a></p>` +
      `<p>如果按钮无法点击，请复制以下链接到浏览器：<br/><span style="word-break:break-all;">${resetUrl}</span></p>` +
      '<p>若非本人操作，可忽略本邮件。</p>' +
      '<p>LingoLoop 团队</p>' +
      '</body></html>';

    await sendMail({ to: user.email, subject, text, html });
  } catch (error) {
    console.error('Failed to queue password reset email:', error);
    return res.status(500).json({ error: '邮件发送失败，请稍后再试。' });
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
    console.error('request-password-reset handler error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: '服务器错误，请稍后再试。' });
    }
  }
}
