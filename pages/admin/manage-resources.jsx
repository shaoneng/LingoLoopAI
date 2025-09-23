import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function AdminManageResources() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [resources, setResources] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState(null);

  // 防止hydration错误
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  React.useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  React.useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchResources();
    }
  }, [user, accessToken]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/admin/shared-resources', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setResources(data.resources || []);
      } else {
        console.error('获取资源失败:', data.error);
      }
    } catch (error) {
      console.error('获取资源失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (resourceId, currentStatus) => {
    setUpdating(resourceId);
    try {
      const response = await fetch(`/api/admin/shared-resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          isPublished: !currentStatus,
        }),
      });

      if (response.ok) {
        await fetchResources();
      } else {
        const data = await response.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      alert('操作失败，请稍后重试');
    } finally {
      setUpdating(null);
    }
  };

  const deleteResource = async (resourceId) => {
    if (!confirm('确定要删除这个资源吗？此操作不可恢复。')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/shared-resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        await fetchResources();
      } else {
        const data = await response.json();
        alert(data.error || '删除失败');
      }
    } catch (error) {
      alert('删除失败，请稍后重试');
    }
  };

  // 显示加载状态
  if (initializing || !isClient) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 检查权限
  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div>权限不足</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
      {/* Navigation */}
      <nav style={{ marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <a
              href="/admin/shared-resources"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 16,
              }}
            >
              上传BBC
            </a>
            <a
              href="/admin/share-to-bbc"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 16,
              }}
            >
              添加到资源库
            </a>
            <span
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              管理BBC
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              欢迎，{user.displayName || user.email}
            </span>
            <a
              href="/dashboard"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              返回面板
            </a>
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>管理BBC资源</h1>
        <a
          href="/admin/shared-resources"
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
          }}
        >
          上传新资源
        </a>
      </div>

      {resources.length === 0 ? (
        <div>暂无资源</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {resources.map((resource) => (
            <div
              key={resource.id}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#fff',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 8px 0' }}>
                    {resource.title}
                    {resource.seasonNumber && ` S${resource.seasonNumber}`}
                    {resource.episodeNumber && ` E${resource.episodeNumber}`}
                  </h3>
                  {resource.description && (
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>{resource.description}</p>
                  )}
                  <div style={{ fontSize: '14px', color: '#888' }}>
                    <div>时长: {resource.durationMs ? `${Math.round(resource.durationMs / 1000)}秒` : '未知'}</div>
                    <div>大小: {resource.sizeBytes ? `${Math.round(resource.sizeBytes / 1024 / 1024)}MB` : '未知'}</div>
                    <div>上传时间: {new Date(resource.createdAt).toLocaleString()}</div>
                    {resource.publishDate && (
                      <div>发布时间: {new Date(resource.publishDate).toLocaleString()}</div>
                    )}
                    {resource.bbcUrl && (
                      <div>
                        BBC链接:{' '}
                        <a href={resource.bbcUrl} target="_blank" rel="noopener noreferrer">
                          查看
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <span
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      backgroundColor: resource.isPublished ? '#d4edda' : '#fff3cd',
                      color: resource.isPublished ? '#155724' : '#856404',
                    }}
                  >
                    {resource.isPublished ? '已发布' : '草稿'}
                  </span>

                  <button
                    onClick={() => togglePublish(resource.id, resource.isPublished)}
                    disabled={updating === resource.id}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: updating === resource.id ? 'not-allowed' : 'pointer',
                      backgroundColor: resource.isPublished ? '#ffc107' : '#28a745',
                      color: 'white',
                    }}
                  >
                    {updating === resource.id
                      ? '处理中...'
                      : resource.isPublished
                      ? '取消发布'
                      : '发布'}
                  </button>

                  <button
                    onClick={() => deleteResource(resource.id)}
                    style={{
                      padding: '6px 12px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: '#dc3545',
                      color: 'white',
                    }}
                  >
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}