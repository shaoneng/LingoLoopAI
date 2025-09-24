import React from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (accessToken && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2>请先登录</h2>
          <Link href="/login">
            <a style={{ color: '#2563eb', textDecoration: 'none' }}>前往登录</a>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <nav style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>
          LingoLoop AI
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: '#64748b' }}>
            欢迎，{user.displayName || user.email}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer'
            }}
          >
            退出登录
          </button>
        </div>
      </nav>

      <main style={{ padding: '2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem', color: '#1e293b' }}>
            欢迎回来，{user.displayName || user.email}！
          </h1>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                我的音频文件
              </h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                管理您的音频文件和转录结果
              </p>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                上传音频
              </button>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                学习统计
              </h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                查看您的学习进度和成就
              </p>
              <Link href="/stats">
                <a style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '0.375rem'
                }}>
                  查看统计
                </a>
              </Link>
            </div>

            <div style={{
              backgroundColor: 'white',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
                设置
              </h3>
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                管理您的账户设置和偏好
              </p>
              <button
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer'
                }}
              >
                账户设置
              </button>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#1e293b' }}>
              最近活动
            </h2>
            <p style={{ color: '#64748b' }}>
              您还没有任何音频文件。点击"上传音频"开始使用 LingoLoop AI。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}