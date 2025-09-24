import prisma from '../prisma';
import { verifyAccessToken, extractBearerToken } from '../auth';

function makeHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export async function authenticate(req) {
  const token = extractBearerToken(req?.headers?.authorization);
  if (!token) return { token: null, user: null, payload: null };
  const payload = verifyAccessToken(token);
  if (!payload?.sub) return { token: null, user: null, payload: null };
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) return { token, user: null, payload };
  return { token, user, payload };
}

export async function requireAuth(req) {
  const { token, user, payload } = await authenticate(req);
  if (!token) throw makeHttpError(401, '未认证请求');
  if (!user) throw makeHttpError(401, '用户不存在或已停用');
  req.user = user;
  req.authToken = token;
  req.authPayload = payload;
  return { user, token, payload };
}

export function requireAuthWrapper(handler) {
  return async function withAuth(req, res) {
    await requireAuth(req);
    return handler(req, res);
  };
}

export function enforceSoftDelete(entity, message = '资源不存在或已删除。') {
  if (!entity || entity.deletedAt) {
    throw makeHttpError(404, message);
  }
  return entity;
}
