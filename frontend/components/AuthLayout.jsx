import React from 'react';

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #f5f8ff 0%, #f1f5f9 100%)',
        padding: '40px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.15)',
          padding: '32px 36px 40px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 14, color: '#64748b', marginBottom: 10, letterSpacing: 0.4 }}>LingoLoop Studio</div>
          <h1 style={{ margin: 0, fontSize: 26, color: '#0f172a', letterSpacing: '-0.01em' }}>{title}</h1>
          {subtitle ? (
            <p style={{ margin: '8px 0 0', fontSize: 15, color: '#475569', lineHeight: 1.5 }}>{subtitle}</p>
          ) : null}
        </header>

        <main>{children}</main>

        {footer ? (
          <footer style={{ marginTop: 28, fontSize: 14, color: '#64748b', textAlign: 'center' }}>
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
