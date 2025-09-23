import React from 'react';

export default function SimpleLoginPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f8ff 0%, #f1f5f9 100%)',
      padding: '40px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 440,
        background: '#ffffff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
        padding: '32px 36px 40px',
        boxSizing: 'border-box',
      }}>
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10, letterSpacing: 0.4 }}>LingoLoop Studio</div>
          <h1 style={{ margin: 0, fontSize: 26, color: '#0f172a', letterSpacing: '-0.01em' }}>欢迎回来</h1>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: '#475569', lineHeight: 1.5 }}>
            使用注册邮箱和密码登录，继续你的学习笔记。
          </p>
        </header>

        <form>
          <div style={{ display: 'block', marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>邮箱</label>
            <input
              type="email"
              placeholder="请输入邮箱"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5f5',
                fontSize: 15,
              }}
            />
          </div>

          <div style={{ display: 'block', marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 14, color: '#475569', marginBottom: 6 }}>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #cbd5f5',
                fontSize: 15,
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px 16px',
              background: '#2563eb',
              color: '#fff',
              borderRadius: 10,
              border: 'none',
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            登录
          </button>
        </form>

        <footer style={{ marginTop: 28, fontSize: 14, color: '#64748b', textAlign: 'center' }}>
          没有账号？ <a href="/register" style={{ color: '#2563eb', textDecoration: 'none' }}>创建一个</a>
        </footer>
      </div>
    </div>
  );
}