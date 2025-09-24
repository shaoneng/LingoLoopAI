import React, { Suspense, lazy } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';
import { authenticatedGet, uploadFile } from '../../lib/api';
import { API_ENDPOINTS } from '../../lib/api';
import { usePerformance, useComponentPerformance } from '../../hooks/usePerformance';

// Lazy load heavy components
const LearningStats = lazy(() => import('./LearningStats'));
const ProgressTracker = lazy(() => import('./ProgressTracker'));
const AudioUploadModal = lazy(() => import('./AudioUploadModal'));
const TestModal = lazy(() => import('./TestModal'));

// 工具函数
function formatDuration(ms) {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function formatDate(str) {
  if (!str) return '—';
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(str));
  } catch (error) {
    return str;
  }
}

function zhStatus(status) {
  if (!status) return '—';
  const statusMap = {
    'uploading': '上传中',
    'uploaded': '已上传',
    'transcribing': '转写中',
    'transcribed': '已转写',
    'failed': '失败',
  };
  return statusMap[status] || status;
}

const getStatusColor = (status) => {
  const colorMap = {
    'uploading': '#ffc107',
    'uploaded': '#17a2b8',
    'transcribing': '#007bff',
    'transcribed': '#28a745',
    'failed': '#dc3545',
  };
  return colorMap[status] || '#6c757d';
};

export default function EnhancedDashboard() {
  const { user, accessToken, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [listening, setListening] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('my-audio');
  const [error, setError] = React.useState(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);
  const [showTestModal, setShowTestModal] = React.useState(false);

  // 无限滚动观察器
  React.useEffect(() => {
    if (loading || !hasMore) return;

    const lastCard = document.querySelector('[data-last-card="true"]');
    if (!lastCard) return;

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    intersectionObserver.observe(lastCard);

    return () => {
      if (intersectionObserver) {
        intersectionObserver.disconnect();
      }
    };
  }, [loading, hasMore, items.length]);

  // 加载数据
  const loadData = React.useCallback(async ({ page: pageNum, q: query }) => {
    if (!accessToken) return;

    console.log('Loading audio data for page:', pageNum, 'query:', query);
    setLoading(true);
    setError(null);

    try {
      const response = await authenticatedGet(API_ENDPOINTS.AUDIOS, accessToken, {
        page: pageNum,
        pageSize: 10,
        ...(query && { q: query }),
      });

      console.log('API response:', response);

      if (pageNum === 1) {
        setItems(response.items || []);
      } else {
        setItems(prev => [...prev, ...(response.items || [])]);
      }

      setHasMore(response.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Load data error:', error);
      setError(error.message || '获取音频列表失败');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // 初始化加载数据
  React.useEffect(() => {
    if (!authLoading && user && accessToken && activeTab === 'my-audio') {
      loadData({ page: 1, q: search });
    }
  }, [user, accessToken, authLoading, loadData, search, activeTab]);

  // 处理搜索 - 优化防抖
  const handleSearch = React.useCallback(
    (e) => {
      e.preventDefault();
      loadData({ page: 1, q: search });
    },
    [loadData, search]
  );

  // 加载更多
  const loadMore = () => {
    if (hasMore && !loading) {
      loadData({ page: page + 1, q: search });
    }
  };

  // 上传完成后的处理
  const handleUploadComplete = (audioId) => {
    console.log('Upload completed for audio:', audioId);
    loadData({ page: 1, q: search });
  };

  // 上传错误处理
  const handleUploadError = (errorMessage) => {
    setError(`上传失败: ${errorMessage}`);
  };

  // 退出登录处理
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  // 手动启动转写
  const handleManualTranscribe = async (audioId) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const response = await authenticatedPost(
        API_ENDPOINTS.AUDIO_TRANSCRIBE(audioId),
        accessToken,
        {
          engine: 'google-speech-v2',
          language: 'en-US',
          diarize: true,
          gapSec: 0.8,
        }
      );

      if (response.success) {
        loadData({ page: 1, q: search });
      } else {
        throw new Error('转写启动失败');
      }
    } catch (error) {
      setError(`转写启动失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = async (file) => {
    if (!accessToken) return;

    try {
      // 这里需要适配你的 Workers 上传 API
      const response = await uploadFile(
        API_ENDPOINTS.UPLOADS_COMMIT,
        file,
        accessToken,
        { filename: file.name }
      );

      if (response.success) {
        handleUploadComplete(response.audioId);
        return response;
      } else {
        throw new Error(response.error || '上传失败');
      }
    } catch (error) {
      console.error('File upload error:', error);
      throw error;
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <button
              onClick={() => setActiveTab('my-audio')}
              style={{
                color: activeTab === 'my-audio' ? '#2563eb' : '#64748b',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: activeTab === 'my-audio' ? 600 : 'normal',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              我的音频
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                color: activeTab === 'stats' ? '#2563eb' : '#64748b',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: activeTab === 'stats' ? 600 : 'normal',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              学习统计
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              style={{
                color: activeTab === 'progress' ? '#2563eb' : '#64748b',
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: activeTab === 'progress' ? 600 : 'normal',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px 0',
              }}
            >
              学习进度
            </button>
            {user.role === 'ADMIN' && (
              <>
                <Link
                  href="/admin/shared-resources"
                  style={{
                    color: '#64748b',
                    textDecoration: 'none',
                    fontSize: 16,
                  }}
                >
                  上传BBC
                </Link>
                <Link
                  href="/admin/share-to-bbc"
                  style={{
                    color: '#64748b',
                    textDecoration: 'none',
                    fontSize: 16,
                  }}
                >
                  添加到资源库
                </Link>
                <Link
                  href="/admin/manage-resources"
                  style={{
                    color: '#64748b',
                    textDecoration: 'none',
                    fontSize: 16,
                  }}
                >
                  管理BBC
                </Link>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 14, color: '#64748b' }}>
              欢迎，{user.displayName || user.email}
            </span>
            <Link
              href="/subscription"
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: '#f3f4f6',
                color: '#374151',
                textDecoration: 'none',
                fontSize: 14,
              }}
            >
              订阅
            </Link>
            <button
              onClick={handleLogout}
              disabled={logoutLoading}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                fontSize: 14,
                cursor: logoutLoading ? 'not-allowed' : 'pointer',
                fontWeight: 500,
              }}
            >
              {logoutLoading ? '退出中...' : '退出登录'}
            </button>
          </div>
        </div>
      </nav>

      {/* 内容区域 */}
      {activeTab === 'my-audio' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>我的音频</h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button
                onClick={() => loadData({ page: 1, q: search })}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 500,
                }}
              >
                {loading ? '刷新中...' : '刷新'}
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                📤 上传音频
              </button>
            </div>
          </div>

          {/* 搜索栏 */}
          <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索音频文件..."
                style={{
                  flex: 1,
                  padding: '10px 16px',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                搜索
              </button>
            </div>
          </form>

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
            {items.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px',
              }}>
                {/* 卡片项 */}
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    data-last-card={index === items.length - 1}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: 12,
                      padding: '20px',
                      backgroundColor: '#ffffff',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
                    }}
                  >
                    {/* 文件名和语言 */}
                    <div style={{ marginBottom: '16px' }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        margin: '0 0 6px 0',
                        color: '#1f2937',
                        lineHeight: '1.3',
                        wordBreak: 'break-word',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {item.filename}
                      </h3>
                      {item.language && (
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <span style={{ padding: '2px 6px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                            🌐 {item.language}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 时长和状态 */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px',
                        color: '#6b7280'
                      }}>
                        <span>⏱️</span>
                        <span>{formatDuration(item.durationMs)}</span>
                      </div>
                      <div>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: 20,
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getStatusColor(item.status) + '20',
                            color: getStatusColor(item.status),
                            border: `1px solid ${getStatusColor(item.status)}40`,
                          }}
                        >
                          {zhStatus(item.status)}
                        </span>
                      </div>
                    </div>

                    {/* 创建时间 */}
                    <div style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span>📅</span>
                      <span>{formatDate(item.createdAt)}</span>
                    </div>

                    {/* 操作按钮 */}
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      borderTop: '1px solid #f3f4f6',
                      paddingTop: '12px',
                    }}>
                      <Link
                        href={`/audios/${item.id}`}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: '#2563eb',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: 6,
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'center',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#1d4ed8';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#2563eb';
                        }}
                      >
                        查看详情
                      </Link>
                      {item.latestRun && item.latestRun.status === 'transcribed' ? (
                        <Link
                          href={`/runs/${item.latestRun.id}`}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: '#10b981',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: 6,
                            fontSize: '13px',
                            fontWeight: '500',
                            textAlign: 'center',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#059669';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#10b981';
                          }}
                        >
                          播放转写
                        </Link>
                      ) : item.status === 'uploaded' || item.status === 'failed' ? (
                        <button
                          onClick={() => handleManualTranscribe(item.id)}
                          disabled={loading}
                          style={{
                            flex: 1,
                            padding: '8px 16px',
                            backgroundColor: loading ? '#9ca3af' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: '13px',
                            fontWeight: '500',
                            textAlign: 'center',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.2s',
                          }}
                        >
                          {loading ? '处理中...' : '开始转写'}
                        </button>
                      ) : item.status === 'transcribing' ? (
                        <div style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          borderRadius: 6,
                          fontSize: '13px',
                          fontWeight: '500',
                          textAlign: 'center',
                        }}>
                          转写中...
                        </div>
                      ) : null}
                    </div>

                    {/* 文件大小 */}
                    {item.sizeBytes && (
                      <div style={{
                        fontSize: '11px',
                        color: '#d1d5db',
                        marginTop: '8px',
                        textAlign: 'center',
                      }}>
                        {(parseInt(item.sizeBytes) / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#6c757d' }}>
                {loading ? '加载中...' : (
                  <div>
                    <p style={{ marginBottom: 16, fontSize: 16 }}>还没有上传任何音频文件</p>
                    <p style={{ marginBottom: 20, color: '#6c757d', fontSize: 14 }}>
                      上传音频文件开始您的英语听力训练之旅
                    </p>
                    <button
                      style={{
                        padding: '12px 24px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        borderRadius: 6,
                        fontSize: 14,
                        fontWeight: 500,
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onClick={() => setShowUploadModal(true)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#1d4ed8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#2563eb';
                      }}
                    >
                      📤 上传音频
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 学习统计页面 - Lazy loaded */}
      {activeTab === 'stats' && (
        <Suspense fallback={<div>加载中...</div>}>
          <LearningStats />
        </Suspense>
      )}

      {/* 学习进度页面 - Lazy loaded */}
      {activeTab === 'progress' && (
        <Suspense fallback={<div>加载中...</div>}>
          <ProgressTracker />
        </Suspense>
      )}

      {/* 实时状态指示器 */}
      {listening && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          backgroundColor: '#28a745',
          color: 'white',
          padding: '8px 16px',
          borderRadius: 20,
          fontSize: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          实时更新中
        </div>
      )}

      {/* 音频上传模态框 - Lazy loaded */}
      <Suspense fallback={<div>加载中...</div>}>
        <AudioUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          accessToken={accessToken}
          user={user}
          onUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onFileUpload={handleFileUpload}
        />
      </Suspense>

      {/* 测试模态框 - Lazy loaded */}
      <Suspense fallback={<div>加载中...</div>}>
        <TestModal
          isOpen={showTestModal}
          onClose={() => setShowTestModal(false)}
        />
      </Suspense>
    </div>
  );
}