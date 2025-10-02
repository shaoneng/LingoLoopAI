import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import AuthLayout from '../components/AuthLayout';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState('idle'); // idle | success

  React.useEffect(() => {
    if (typeof router.query?.token === 'string') {
      setToken(router.query.token);
    }
  }, [router.query?.token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setError('');
    setStatus('idle');
    if (!token) {
      setError('缺少重置链接 token，请通过邮件中的链接访问。');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }
    if (newPassword.length < 8) {
      setError('密码至少需要 8 个字符。');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = payload?.error || '重置失败，请重新获取邮件链接。';
        throw new Error(message);
      }
      setStatus('success');
    } catch (err) {
      setError(err?.message || '重置失败，请稍后再试。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="设置新密码"
      subtitle="请输入新密码以完成重置。"
      footer={status === 'success' ? (
        <>
          已重置？ <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>返回登录</Link>
        </>
      ) : (
        <>
          想起密码了？ <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>直接登录</Link>
        </>
      )}
    >
      {status === 'success' ? (
        <div
          style={{
            background: 'rgba(34, 197, 94, 0.12)',
            color: '#15803d',
            borderRadius: 8,
            padding: '12px 14px',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          密码已更新。请使用新密码登录。
        </div>
      ) : null}

      <form onSubmit={handleSubmit}>
        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>重置令牌</span>
          <input
            type="text"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            placeholder="请粘贴邮件中的 token"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5f5',
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 16 }}>
          <span style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>新密码</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 10,
              border: '1px solid #cbd5f5',
              fontSize: 15,
            }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: 20 }}>
          <span style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>确认新密码</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
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

        <button
          type="submit"
          disabled={submitting || status === 'success'}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: submitting ? '#93c5fd' : '#2563eb',
            color: '#fff',
            borderRadius: 10,
            border: 'none',
            fontSize: 16,
            fontWeight: 600,
            cursor: submitting || status === 'success' ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s ease',
          }}
        >
          {status === 'success' ? '已完成' : submitting ? '提交中…' : '设置新密码'}
        </button>
      </form>
    </AuthLayout>
  );
}
