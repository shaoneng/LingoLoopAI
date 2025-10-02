import React from 'react';
import { persistAuthSession, readJson, resolveApiUrl } from '../lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(resolveApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await readJson(response);

      if (!response.ok) {
        setError(result?.error || `登录失败（${response.status}）`);
        return;
      }

      if (!result?.accessToken || !result?.user) {
        setError('登录响应异常，请稍后重试');
        return;
      }

      persistAuthSession(result);
      window.location.href = '/';
    } catch (err) {
      setError(err?.message || '网络错误，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '40px',
        backgroundColor: 'white',
        borderRadius: 12,
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: 8
          }}>
            欢迎回来
          </h1>
          <p style={{ color: '#64748b', fontSize: 16 }}>
            登录您的 LingoLoop AI 账户
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: '#374151',
              fontSize: 14,
              fontWeight: 500
            }}>
              邮箱地址
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
              placeholder="请输入邮箱地址"
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block',
              marginBottom: 8,
              color: '#374151',
              fontSize: 14,
              fontWeight: 500
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: 14,
                boxSizing: 'border-box'
              }}
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div style={{
              marginBottom: 20,
              padding: '12px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              borderRadius: 6,
              fontSize: 14
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom: 16
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ color: '#64748b', fontSize: 14 }}>
            还没有账户？{' '}
            <a
              href="/register"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              立即注册
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
