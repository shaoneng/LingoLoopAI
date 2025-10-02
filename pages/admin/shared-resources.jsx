import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';

export default function AdminSharedResources() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    externalUrl: '',
    bbcUrl: '',
    durationMs: '',
    transcript: '',
    licenseInfo: '',
    episodeNumber: '',
    seasonNumber: ''
  });

  // 防止hydration错误
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Check if user is admin
  React.useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleInputChange = React.useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCreateResource = React.useCallback(async () => {
    if (!accessToken || !formData.title.trim()) return;

    setCreating(true);
    setMessage('');

    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';

      const response = await fetch(`${base}/api/admin/shared-resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          externalUrl: formData.externalUrl.trim() || null,
          bbcUrl: formData.bbcUrl.trim() || null,
          durationMs: formData.durationMs ? parseInt(formData.durationMs) : null,
          transcript: formData.transcript.trim() || null,
          licenseInfo: formData.licenseInfo.trim() || null,
          episodeNumber: formData.episodeNumber ? parseInt(formData.episodeNumber) : null,
          seasonNumber: formData.seasonNumber ? parseInt(formData.seasonNumber) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(data.error || '创建资源失败');
      }

      // Show success message and reset form
      setMessage('BBC资源创建成功！该资源已添加到BBC资源库，可在管理页面进行发布设置。');
      setFormData({
        title: '',
        description: '',
        externalUrl: '',
        bbcUrl: '',
        durationMs: '',
        transcript: '',
        licenseInfo: '',
        episodeNumber: '',
        seasonNumber: ''
      });

    } catch (err) {
      setMessage(err.message || '创建失败');
      console.error('Create resource error:', err);
    } finally {
      setCreating(false);
    }
  }, [accessToken, formData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setMessage('请输入资源标题');
      return;
    }

    await handleCreateResource();
  };

  // 显示加载状态
  if (initializing || !isClient) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 检查权限
  if (!user || user.role !== 'ADMIN') {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
        <div>权限不足</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px' }}>
      {/* Navigation */}
      <nav style={{ marginBottom: 24, padding: '16px 0', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
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
            <a
              href="/admin/manage-resources"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 16,
              }}
            >
              管理BBC
            </a>
            <span
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              上传BBC
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

      <h1>创建BBC资源</h1>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        添加BBC节目的元数据和转写内容，不托管实际音频文件
      </p>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          borderRadius: '6px',
          backgroundColor: message.includes('成功') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') ? '#155724' : '#721c24',
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
            资源标题 *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            disabled={creating}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
            }}
            placeholder="输入节目标题"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
            资源描述
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            disabled={creating}
            rows={3}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
            }}
            placeholder="输入节目简介或学习要点"
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
            外部音频链接
          </label>
          <input
            type="url"
            name="externalUrl"
            value={formData.externalUrl}
            onChange={handleInputChange}
            disabled={creating}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            placeholder="https://example.com/audio.mp3"
          />
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            可选：指向外部音频源的链接（如BBC官网）
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
            BBC官网链接
          </label>
          <input
            type="url"
            name="bbcUrl"
            value={formData.bbcUrl}
            onChange={handleInputChange}
            disabled={creating}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
            }}
            placeholder="https://www.bbc.co.uk/learningenglish/..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
              音频时长（毫秒）
            </label>
            <input
              type="number"
              name="durationMs"
              value={formData.durationMs}
              onChange={handleInputChange}
              disabled={creating}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="360000"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
              许可信息
            </label>
            <input
              type="text"
              name="licenseInfo"
              value={formData.licenseInfo}
              onChange={handleInputChange}
              disabled={creating}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="CC BY-SA 4.0"
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
              季数
            </label>
            <input
              type="number"
              name="seasonNumber"
              value={formData.seasonNumber}
              onChange={handleInputChange}
              disabled={creating}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="1"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
              集数
            </label>
            <input
              type="number"
              name="episodeNumber"
              value={formData.episodeNumber}
              onChange={handleInputChange}
              disabled={creating}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
              }}
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '16px', fontWeight: '500' }}>
            转写内容
          </label>
          <textarea
            name="transcript"
            value={formData.transcript}
            onChange={handleInputChange}
            disabled={creating}
            rows={6}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical',
            }}
            placeholder="输入节目转写文本，支持词汇分析和学习功能"
          />
        </div>

        <button
          type="submit"
          disabled={!formData.title.trim() || creating}
          style={{
            padding: '16px 32px',
            backgroundColor: !formData.title.trim() || creating ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: !formData.title.trim() || creating ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s',
          }}
        >
          {creating ? '创建中...' : '创建资源'}
        </button>
      </form>

      {creating && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', color: '#666' }}>
            正在创建BBC资源...
          </div>
        </div>
      )}
    </div>
  );
}