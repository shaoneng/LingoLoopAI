const HEADER_NAME = 'x-internal-secret';

export function requireInternalSecret(req) {
  const expected = process.env.INTERNAL_TASK_SECRET;
  if (!expected) {
    const error = new Error('INTERNAL_TASK_SECRET 未配置，无法校验内部任务请求。');
    error.statusCode = 500;
    throw error;
  }
  let header = req.headers?.[HEADER_NAME] || req.headers?.[HEADER_NAME.toLowerCase()];
  if (Array.isArray(header)) {
    header = header[0];
  }
  if (!header || header !== expected) {
    const error = new Error('未授权的内部请求');
    error.statusCode = 401;
    throw error;
  }
}

export function getInternalSecretHeader() {
  return HEADER_NAME;
}
