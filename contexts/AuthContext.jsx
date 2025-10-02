import React from 'react';
import { resolveApiUrl } from '../lib/api-client';
const STORAGE_KEY = 'lingoloop.auth.v1';
const ACCESS_REFRESH_PADDING_MS = 20_000;

function isBrowser() {
  return typeof window !== 'undefined';
}

function readStorage() {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    console.warn('Failed to parse auth storage', error);
    return null;
  }
}

function writeStorage(data) {
  if (!isBrowser()) return;
  if (!data) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to write auth storage', error);
  }
}

async function postJson(path, body) {
  const resp = await fetch(resolveApiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  let payload = null;
  try {
    payload = await resp.json();
  } catch (error) {
    // ignore body parse errors; handled below
  }
  if (!resp.ok) {
    const message = payload?.error || payload?.message || '请求失败，请稍后再试。';
    throw new Error(message);
  }
  return payload;
}

function computeAccessExpiry(expiresInSec) {
  if (!expiresInSec || typeof expiresInSec !== 'number') return null;
  const now = Date.now();
  return new Date(now + expiresInSec * 1000).toISOString();
}

function shouldAutoRefresh(authState) {
  if (!authState?.accessTokenExpiresAt || !authState.refreshToken) return false;
  const expiresAt = new Date(authState.accessTokenExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt - Date.now() <= ACCESS_REFRESH_PADDING_MS;
}

const AuthContext = React.createContext({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  initializing: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  refresh: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [authState, setAuthState] = React.useState(() => readStorage());
  const [initializing, setInitializing] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const refreshTimerRef = React.useRef(null);
  const pendingRefreshRef = React.useRef(null);

  const applyAuthState = React.useCallback((next) => {
    setAuthState(next);
    writeStorage(next);
  }, []);

  const clearAuthState = React.useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    applyAuthState(null);
  }, [applyAuthState]);

  const scheduleRefresh = React.useCallback((state) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (!state?.accessTokenExpiresAt || !state.refreshToken) return;
    const expiresAt = new Date(state.accessTokenExpiresAt).getTime();
    if (Number.isNaN(expiresAt)) return;
    const delayMs = Math.max(0, expiresAt - Date.now() - ACCESS_REFRESH_PADDING_MS);
    refreshTimerRef.current = setTimeout(() => {
      pendingRefreshRef.current?.();
    }, delayMs);
  }, []);

  const handleAuthPayload = React.useCallback((payload) => {
    if (!payload) return null;
    const nextState = {
      user: payload.user ?? null,
      accessToken: payload.accessToken ?? null,
      accessTokenExpiresAt: payload.accessTokenExpiresAt || computeAccessExpiry(payload.accessTokenExpiresIn),
      refreshToken: payload.refreshToken ?? null,
      refreshTokenExpiresAt: payload.refreshTokenExpiresAt ?? null,
    };
    applyAuthState(nextState);
    scheduleRefresh(nextState);
    return nextState;
  }, [applyAuthState, scheduleRefresh]);

  const refresh = React.useCallback(async () => {
    if (!authState?.refreshToken) throw new Error('缺少 refresh token');
    const payload = await postJson('/api/auth/refresh', { refreshToken: authState.refreshToken });
    pendingRefreshRef.current = null;
    return handleAuthPayload(payload);
  }, [authState?.refreshToken, handleAuthPayload]);

  const login = React.useCallback(async ({ email, password }) => {
    setLoading(true);
    try {
      const payload = await postJson('/api/auth/login', { email, password });
      handleAuthPayload(payload);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }, [handleAuthPayload]);

  const register = React.useCallback(async ({ email, password, displayName }) => {
    setLoading(true);
    try {
      const payload = await postJson('/api/auth/register', { email, password, displayName });
      handleAuthPayload(payload);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }, [handleAuthPayload]);

  const loginWithGoogle = React.useCallback(async ({ credential }) => {
    if (!credential) {
      throw new Error('缺少 Google 登录凭证。');
    }
    setLoading(true);
    try {
      const payload = await postJson('/api/auth/google', { credential });
      handleAuthPayload(payload);
      return payload.user;
    } finally {
      setLoading(false);
    }
  }, [handleAuthPayload]);

  const logout = React.useCallback(async () => {
    if (!authState?.refreshToken) {
      clearAuthState();
      return;
    }
    try {
      await postJson('/api/auth/logout', { refreshToken: authState.refreshToken });
    } catch (error) {
      console.warn('Logout request failed', error);
    } finally {
      clearAuthState();
    }
  }, [authState?.refreshToken, clearAuthState]);

  const setUser = React.useCallback((updater) => {
    setAuthState((current) => {
      if (!current) return current;
      const nextUser = typeof updater === 'function' ? updater(current.user) : updater;
      const nextState = { ...current, user: nextUser };
      writeStorage(nextState);
      return nextState;
    });
  }, []);

  React.useEffect(() => {
    if (!authState?.refreshToken) {
      setInitializing(false);
      return;
    }

    const doRefreshIfNeeded = async () => {
      if (!shouldAutoRefresh(authState)) {
        scheduleRefresh(authState);
        setInitializing(false);
        return;
      }
      try {
        pendingRefreshRef.current = doRefreshIfNeeded;
        await refresh();
      } catch (error) {
        console.warn('Auto refresh failed', error);
        clearAuthState();
      } finally {
        setInitializing(false);
      }
    };

    pendingRefreshRef.current = doRefreshIfNeeded;
    doRefreshIfNeeded();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      pendingRefreshRef.current = null;
    };
  }, [authState, clearAuthState, refresh, scheduleRefresh]);

  const value = React.useMemo(() => ({
    user: authState?.user ?? null,
    accessToken: authState?.accessToken ?? null,
    refreshToken: authState?.refreshToken ?? null,
    accessTokenExpiresAt: authState?.accessTokenExpiresAt ?? null,
    refreshTokenExpiresAt: authState?.refreshTokenExpiresAt ?? null,
    loading,
    initializing,
    login,
    register,
    loginWithGoogle,
    logout,
    refresh,
    setUser,
  }), [authState, initializing, loading, login, loginWithGoogle, logout, refresh, register, setUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
