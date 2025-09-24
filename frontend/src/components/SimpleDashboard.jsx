import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedGet } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/api';

// 简化版本，用于测试基本功能
export default function SimpleDashboard() {
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // 加载数据
  const loadData = React.useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedGet(API_ENDPOINTS.AUDIOS, accessToken, {
        page: 1,
        pageSize: 10,
      });

      console.log('API response:', response);
      setItems(response.items || []);
    } catch (error) {
      console.error('Load data error:', error);
      setError(error.message || '获取音频列表失败');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // 初始化加载数据
  React.useEffect(() => {
    if (!authLoading && user && accessToken) {
      loadData();
    }
  }, [user, accessToken, authLoading, loadData]);

  // 退出登录处理
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h1 style={{ fontSize: 32, marginBottom: 16, color: '#1f2937' }}>
            欢迎使用 LingoLoop Studio
          </h1>
          <p style={{ fontSize: 18, color: '#6b7280', marginBottom: 32 }}>
            请先登录以访问您的音频文件和学习统计
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link
              href="/login"
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              立即登录
            </Link>
            <Link
              href="/register"
              style={{
                padding: '12px 24px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              注册账号
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      {/* 导航栏 */}
      <nav style={{ marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>我的音频</h1>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              欢迎，{user.displayName || user.email}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              退出登录
            </button>
          </div>
        </div>
      </nav>

      {/* 错误提示 */}
      {error && (
        <div style={{
          marginBottom: 16,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(220,53,69,0.12)',
          color: '#a11',
          fontSize: 14
        }}>
          错误: {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 12,
              background: 'none',
              border: 'none',
              color: '#a11',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* 音频列表 */}
      <div style={{ backgroundColor: 'white', borderRadius: 8, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            加载中...
          </div>
        ) : items.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px',
          }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '20px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }}
              >
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0 0 12px 0',
                  color: '#1f2937',
                }}>
                  {item.filename}
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    ⏱️ {Math.round((item.durationMs || 0) / 1000)}秒
                  </span>
                  <span style={{
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#28a74520',
                    color: '#28a745',
                  }}>
                    {item.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '12px' }}>
                  📅 {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                </div>
                <Link
                  href={`/audios/${item.id}`}
                  style={{
                    display: 'block',
                    padding: '8px 16px',
                    backgroundColor: '#2563eb',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: 6,
                    fontSize: '13px',
                    fontWeight: '500',
                    textAlign: 'center',
                  }}
                >
                  查看详情
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
            <p style={{ marginBottom: 16, fontSize: 16 }}>还没有上传任何音频文件</p>
            <p style={{ color: '#6c757d', fontSize: 14 }}>
              上传音频文件开始您的英语听力训练之旅
            </p>
          </div>
        )}
      </div>

      {/* 调试信息 */}
      <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f8f9fa', borderRadius: 8, fontSize: 12 }}>
        <h4>调试信息:</h4>
        <p>用户: {user.email}</p>
        <p>访问令牌: {accessToken ? '已设置' : '未设置'}</p>
        <p>音频数量: {items.length}</p>
        <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
      </div>
    </div>
  );
}