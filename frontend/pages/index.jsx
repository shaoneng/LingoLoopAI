import React from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  if (user) {
    router.push('/dashboard');
    return null;
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600, padding: '40px' }}>
        <h1 style={{
          fontSize: 56,
          fontWeight: 800,
          color: 'white',
          marginBottom: 20,
          textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
        }}>
          LingoLoop AI
        </h1>
        <p style={{
          fontSize: 20,
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 40,
          lineHeight: 1.6
        }}>
          智能语音转录与英语学习平台
          <br />
          让 AI 助您提升英语听说能力
        </p>
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <a
            href="/login"
            style={{
              padding: '16px 32px',
              backgroundColor: 'white',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              display: 'inline-block',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
          >
            立即登录
          </a>
          <a
            href="/register"
            style={{
              padding: '16px 32px',
              backgroundColor: 'transparent',
              color: 'white',
              textDecoration: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              display: 'inline-block',
              border: '2px solid white',
              transition: 'all 0.2s',
            }}
          >
            免费注册
          </a>
        </div>
      </div>
    </div>
  );
}