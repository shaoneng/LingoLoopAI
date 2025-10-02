const candidates = [process.env.NEXT_PUBLIC_API_BASE, process.env.NEXT_PUBLIC_API_BASE_URL];
const rawApiBase = candidates.find((value) => typeof value === 'string' && value.trim().length > 0) || '';
const API_BASE = rawApiBase ? rawApiBase.trim().replace(/\/$/, '') : '';

export function resolveApiUrl(path) {
  if (!path?.startsWith('/')) {
    throw new Error('resolveApiUrl expects an absolute path starting with "/"');
  }
  return API_BASE ? `${API_BASE}${path}` : path;
}

export async function readJson(response) {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

export function persistAuthSession(payload) {
  if (!payload?.accessToken || !payload?.user) return false;
  if (typeof window === 'undefined') return false;
  window.localStorage.setItem('accessToken', payload.accessToken);
  window.localStorage.setItem('user', JSON.stringify(payload.user));
  return true;
}
