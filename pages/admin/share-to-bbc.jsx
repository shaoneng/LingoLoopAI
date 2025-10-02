import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import { parseAudioFilename } from '../../lib/audioMetadata';

function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function zhStatus(status) {
  if (!status) return '—';
  const map = {
    uploaded: '已上传',
    uploading: '上传中',
    transcribed: '已转写',
    processing: '处理中',
    queued: '排队中',
    failed: '失败',
    quota_exceeded: '配额超限',
  };
  return map[status] || status;
}

export default function AdminShareToBBC() {
  const { user, accessToken, initializing } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [sharing, setSharing] = React.useState({});
  const [showShareModal, setShowShareModal] = React.useState(false);
  const [selectedAudio, setSelectedAudio] = React.useState(null);
  const [shareForm, setShareForm] = React.useState({ title: '', description: '', bbcUrl: '' });
  const [sharedResources, setSharedResources] = React.useState(new Set());

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

  const loadSharedResources = React.useCallback(async () => {
    if (!accessToken) return;
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/admin/shared-resources`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (resp.ok) {
        const data = await resp.json();
        const sharedUrls = new Set(data.resources.map(r => r.audioUrl));
        setSharedResources(sharedUrls);
      }
    } catch (error) {
      console.error('Failed to load shared resources:', error);
    }
  }, [accessToken]);

  const loadData = React.useCallback(async ({ page: nextPage = 1, q = '' } = {}) => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const params = new URLSearchParams({ page: String(nextPage) });
      if (q) params.set('q', q);
      const resp = await fetch(`${base}/api/audios?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      let data;
      try {
        data = await resp.json();
      } catch (jsonError) {
        const errorText = await resp.text();
        console.error('Audios API response not JSON:', errorText);

        // If we get HTML response (likely login page), it's probably an auth issue
        if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
          throw new Error('认证失败，请重新登录');
        }

        throw new Error(`加载失败: 服务器返回了非JSON响应 (${resp.status})`);
      }

      if (!resp.ok) {
        // Handle authentication errors
        if (resp.status === 401) {
          throw new Error('认证失败，请重新登录');
        }
        throw new Error(data.error || '加载失败');
      }
      setItems(data.items || []);
      setPage(data.page || 1);
      setTotalPages(Math.max(1, data.totalPages || 1));

      // Also load shared resources to check which audios are already shared
      await loadSharedResources();
    } catch (err) {
      setError(err.message || '加载失败');
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  }, [accessToken, loadSharedResources]);

  React.useEffect(() => {
    if (!user || !accessToken) return;
    loadData({ page: 1, q: search });
  }, [user, accessToken, loadData, search]);

  // 订阅实时状态更新
  React.useEffect(() => {
    if (!user || !accessToken) return undefined;
    const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    const url = `${base}/api/runs/events?access_token=${encodeURIComponent(accessToken)}`;
    let es;
    try {
      es = new EventSource(url);
      setListening(true);
    } catch (e) {
      console.warn('EventSource init failed', e);
      return undefined;
    }

    const applyStatus = ({ audioId, status, completedAt }) => {
      setItems((prev) => prev.map((it) => {
        if (it.id !== audioId) return it;
        const latestRun = it.latestRun || {};
        return {
          ...it,
          latestRun: { ...latestRun, status: status || latestRun.status, completedAt: completedAt || latestRun.completedAt || null },
          status: status === 'succeeded' ? (it.status === 'transcribed' ? it.status : 'transcribed') : it.status,
        };
      }));
    };

    const onSnapshot = (ev) => {
      try {
        const data = JSON.parse(ev.data || '{}');
        const items = Array.isArray(data.items) ? data.items : [];
        items.forEach((r) => applyStatus({ audioId: r.audioId, status: r.status, completedAt: r.completedAt || null }));
      } catch (_) {}
    };
    const onUpdate = (ev) => {
      try { const d = JSON.parse(ev.data || '{}'); applyStatus(d); } catch (_) {}
    };
    const onDone = (ev) => {
      try { const d = JSON.parse(ev.data || '{}'); applyStatus(d); } catch (_) {}
    };

    es.addEventListener('snapshot', onSnapshot);
    es.addEventListener('update', onUpdate);
    es.addEventListener('done', onDone);
    es.addEventListener('error', () => { setListening(false); });

    return () => {
      setListening(false);
      es && es.close();
    };
  }, [user, accessToken]);

  const openShareModal = (audio) => {
    const metadata = parseAudioFilename(audio.filename || '');
    setSelectedAudio(audio);
    setShareForm({
      title: metadata.title || '',
      description: metadata.description || '',
      externalUrl: '',
      bbcUrl: '',
      licenseInfo: '',
      durationMs: audio.durationMs ? audio.durationMs.toString() : '',
      transcript: audio.latestRun?.text || ''
    });
    setShowShareModal(true);
  };

  const handleShareToBBC = async () => {
    if (!selectedAudio || !accessToken) return;

    setSharing(selectedAudio.id);
    try {
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const resp = await fetch(`${base}/api/admin/share-to-bbc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: shareForm.title,
          description: shareForm.description,
          externalUrl: shareForm.externalUrl,
          bbcUrl: shareForm.bbcUrl,
          durationMs: shareForm.durationMs ? parseInt(shareForm.durationMs) : null,
          transcript: shareForm.transcript,
          licenseInfo: shareForm.licenseInfo,
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        if (resp.status === 409 && data.existingResource) {
          throw new Error(`该音频已经在BBC资源库中\n标题: ${data.existingResource.title}\n状态: ${data.existingResource.isPublished ? '已发布' : '草稿'}\n创建时间: ${new Date(data.existingResource.createdAt).toLocaleString()}`);
        }
        throw new Error(data.error || '分享到BBC资源库失败');
      }

      setShowShareModal(false);
      setSelectedAudio(null);

      // Note: In the new model, we don't track shared resources by GCS URI
      // This could be updated to track by resource ID or title if needed

      alert(`成功添加到BBC资源库！\n标题: ${data.resource.title}\n状态: ${data.resource.isPublished ? '已发布' : '草稿'}\n来源: ${data.resource.sourceType === 'cc_licensed' ? '授权内容' : '外部链接'}`);
    } catch (err) {
      alert(err.message || '分享失败');
    } finally {
      setSharing({});
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

  return (
    <div style={{ maxWidth: 1200, margin: '40px auto', padding: '0 20px', fontFamily: 'Inter, ui-sans-serif, system-ui' }}>
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
              添加到BBC资源库
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

      <header style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>添加音频到BBC资源库</h1>
          <p style={{ color: '#64748b', marginTop: 8 }}>
            选择已转录的音频添加到BBC资源库，供其他用户学习
            {listening && <span style={{ marginLeft: 8, fontSize: 12, color: '#16a34a' }}>· 实时更新已连接</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, width: '100%', maxWidth: 480 }}>
          <input
            type="search"
            placeholder="搜索文件名"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #d4d4d8',
              fontSize: 14,
            }}
          />
          <button
            type="button"
            onClick={() => loadData({ page: 1, q: search })}
            disabled={loading}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              background: '#2563eb',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? '刷新中…' : '刷新'}
          </button>
        </div>
      </header>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 8, background: 'rgba(220,53,69,0.08)', color: '#a11' }}>
          {error}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 18,
          minHeight: 200,
        }}
      >
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>加载中…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>暂无音频文件</div>
        ) : (
          items.map((item) => {
            const meta = parseAudioFilename(item.filename || '');
            const latest = item.latestRun;
            const canShare = latest && latest.status === 'succeeded';
    // In the new metadata model, we don't track by GCS URI
    // This could be updated to use a different tracking mechanism if needed
    const isShared = false; // For now, don't show as shared
            const coverGradient = `linear-gradient(135deg, rgba(37,99,235,0.12), rgba(59,130,246,0.35)), url('https://picsum.photos/seed/${item.id.slice(0,6)}/600/400')`;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#fff',
                  boxShadow: '0 15px 35px rgba(15,23,42,0.08)',
                }}
              >
                <div
                  style={{
                    backgroundImage: coverGradient,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    minHeight: 140,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '16px',
                    color: '#fff',
                  }}
                >
                  <h3 style={{ margin: '0', fontSize: 18, lineHeight: 1.4 }}>{meta.title}</h3>
                </div>
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 13, color: '#475569' }}>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }}>
                      {formatDuration(item.durationMs)}
                    </span>
                    <span style={{ padding: '4px 8px', borderRadius: 999, background: latest?.status === 'succeeded' ? '#ecfdf3' : '#fef3c7', color: latest?.status === 'succeeded' ? '#15803d' : '#92400e', fontWeight: 600 }}>
                      {zhStatus(item.status)}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#64748b', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {meta.program ? <span>{meta.program}</span> : null}
                    {meta.dateText ? <span>{meta.dateText}</span> : null}
                    <span>更新于：{new Date(item.updatedAt).toLocaleString()}</span>
                  </div>
                  {latest?.text ? (
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, flex: 1 }}>
                      {latest.text.slice(0, 80)}...
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, color: '#94a3b8', flex: 1 }}>
                      {canShare ? '转写完成，可添加到BBC资源库' : '暂无转写内容'}
                    </div>
                  )}
                </div>
                <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <a
                    href={`/audios/${item.id}`}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: '#6b7280',
                      color: '#fff',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    查看详情
                  </a>
                  {isShared ? (
                    <div
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: '#3b82f6',
                        color: '#fff',
                        fontWeight: 600,
                        textAlign: 'center',
                        fontSize: '12px',
                      }}
                    >
                      ✓ 已添加
                    </div>
                  ) : (
                    <button
                      onClick={() => openShareModal(item)}
                      disabled={!canShare || !!sharing[item.id]}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        background: canShare ? '#10b981' : '#9ca3af',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: canShare ? 'pointer' : 'not-allowed',
                        border: 'none',
                      }}
                    >
                      {sharing[item.id] ? '处理中…' : '添加到BBC'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && selectedAudio && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: 12,
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 20 }}>添加到BBC资源库</h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                标题 *
              </label>
              <input
                type="text"
                value={shareForm.title}
                onChange={(e) => setShareForm({ ...shareForm, title: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4d4d8',
                  borderRadius: 6,
                  fontSize: '14px',
                }}
                placeholder="输入资源标题"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                描述
              </label>
              <textarea
                value={shareForm.description}
                onChange={(e) => setShareForm({ ...shareForm, description: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4d4d8',
                  borderRadius: 6,
                  fontSize: '14px',
                  minHeight: '80px',
                  resize: 'vertical',
                }}
                placeholder="输入资源描述"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                外部音频链接
              </label>
              <input
                type="url"
                value={shareForm.externalUrl}
                onChange={(e) => setShareForm({ ...shareForm, externalUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4d4d8',
                  borderRadius: 6,
                  fontSize: '14px',
                }}
                placeholder="https://example.com/audio.mp3"
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                可选：指向外部音频源的链接
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                BBC官网链接
              </label>
              <input
                type="url"
                value={shareForm.bbcUrl}
                onChange={(e) => setShareForm({ ...shareForm, bbcUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4d4d8',
                  borderRadius: 6,
                  fontSize: '14px',
                }}
                placeholder="https://www.bbc.co.uk/learningenglish/..."
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                许可信息
              </label>
              <input
                type="text"
                value={shareForm.licenseInfo}
                onChange={(e) => setShareForm({ ...shareForm, licenseInfo: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4d4d8',
                  borderRadius: 6,
                  fontSize: '14px',
                }}
                placeholder="CC BY-SA 4.0"
              />
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                如提供许可信息，资源将标记为授权内容
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setSelectedAudio(null);
                }}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #d4d4d8',
                  background: 'white',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleShareToBBC}
                disabled={!shareForm.title.trim() || !!sharing[selectedAudio.id]}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: shareForm.title.trim() ? '#10b981' : '#9ca3af',
                  color: 'white',
                  borderRadius: 6,
                  cursor: shareForm.title.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                {sharing[selectedAudio.id] ? '添加中…' : '确认添加'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ color: '#64748b', fontSize: 13 }}>第 {page} / {totalPages} 页</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            onClick={() => loadData({ page: Math.max(1, page - 1), q: search })}
            disabled={loading || page <= 1}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5f5', background: '#fff', cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          >
            上一页
          </button>
          <button
            type="button"
            onClick={() => loadData({ page: Math.min(totalPages, page + 1), q: search })}
            disabled={loading || page >= totalPages}
            style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #cbd5f5', background: '#fff', cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}