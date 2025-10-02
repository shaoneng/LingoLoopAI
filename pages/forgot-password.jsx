import React from 'react';
import Link from 'next/link';
import AuthLayout from '../components/AuthLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [message, setMessage] = React.useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    setStatus('idle');
    setMessage('');
    try {
      const resp = await fetch(`${API_BASE}/api/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        if (resp.status === 404) {
          setStatus('pending');
          setMessage('密码重置服务尚未就绪，请稍后再试或联系管理员。');
          return;
        }
        const msg = payload?.error || payload?.message || '请求失败，请稍后再试。';
        throw new Error(msg);
      }
      setStatus('success');
      setMessage('如果该邮箱已注册，我们会将重置链接发送过去，请注意查收。');
    } catch (err) {
      setError(err?.message || '请求失败，请稍后再试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="重置密码"
      subtitle="输入注册邮箱，我们会发送重置链接。"
      footer={(
        <>
          已经想起密码？ <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>返回登录</Link>
        </>
      )}
    >
      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>邮箱</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5f5',
              fontSize: 15,
            }}
          />
        </label>

        {error ? (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#b91c1c',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 20,
          }}>
            {error}
          </div>
        ) : null}

        {status !== 'idle' && !error ? (
          <div style={{
            background: status === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(59, 130, 246, 0.12)',
            color: status === 'success' ? '#15803d' : '#1d4ed8',
            borderRadius: 8,
            padding: '10px 12px',
            marginBottom: 20,
          }}>
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: submitting ? '#93c5fd' : '#2563eb',
            color: '#fff',
            borderRadius: 10,
            border: 'none',
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {submitting ? '发送中…' : '发送重置链接'}
        </button>
      </form>
    </AuthLayout>
  );
}
