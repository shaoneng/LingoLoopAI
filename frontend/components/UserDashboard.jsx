import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import LearningStats from './LearningStats';
import ProgressTracker from './ProgressTracker';
import AudioUploadModal from './AudioUploadModal';

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

const QuickStats = ({ items }) => {
  const totalAudios = items.length;
  const transcribedAudios = items.filter(item => item.status === 'transcribed').length;
  const totalDuration = items.reduce((sum, item) => sum + (item.durationMs || 0), 0);
  const totalMinutes = Math.round(totalDuration / 60000);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">总音频数</p>
            <p className="text-2xl font-bold text-gray-900">{totalAudios}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-blue-600 text-xl">🎵</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">已转写</p>
            <p className="text-2xl font-bold text-gray-900">{transcribedAudios}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <span className="text-green-600 text-xl">✅</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">总时长</p>
            <p className="text-2xl font-bold text-gray-900">{totalMinutes}分</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-purple-600 text-xl">⏱️</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">处理中</p>
            <p className="text-2xl font-bold text-gray-900">
              {items.filter(item => item.status === 'transcribing').length}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <span className="text-orange-600 text-xl">⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const WelcomeSection = ({ user, onUpload }) => (
  <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 md:p-12 text-white mb-8 relative overflow-hidden">
    <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]"></div>
    <div className="relative z-10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white/90 mb-4">
            <span className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></span>
            欢迎回来
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold mb-3 tracking-tight">
            {user.displayName || user.email}
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed">
            继续您的英语听力学习之旅
          </p>
        </div>
        <button
          onClick={onUpload}
          className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center whitespace-nowrap"
        >
          <span className="mr-2">📤</span>
          上传新音频
        </button>
      </div>
    </div>
  </div>
);

const AudioCard = ({ item, onViewDetails, onPlayTranscript, onManualTranscribe, loading }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 hover:border-gray-200 group">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1 min-w-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 truncate tracking-tight">
          {item.filename}
        </h3>
        {item.language && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            🌐 {item.language}
          </span>
        )}
      </div>
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: getStatusColor(item.status) + '20',
              color: getStatusColor(item.status),
              border: `1px solid ${getStatusColor(item.status)}40`
            }}>
        {zhStatus(item.status)}
      </span>
    </div>

    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
      <div className="flex items-center space-x-6">
        <span className="flex items-center">
          ⏱️ {formatDuration(item.durationMs)}
        </span>
        <span className="flex items-center">
          📅 {formatDate(item.createdAt)}
        </span>
      </div>
      {item.sizeBytes && (
        <span className="text-xs">{(parseInt(item.sizeBytes) / 1024 / 1024).toFixed(2)} MB</span>
      )}
    </div>

    <div className="flex space-x-3">
      <Link
        href={`/audios/${item.id}`}
        className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-full text-sm font-semibold text-center hover:bg-blue-700 transition-all duration-200 hover:shadow-md"
      >
        查看详情
      </Link>

      {item.latestRun && item.latestRun.status === 'transcribed' ? (
        <Link
          href={`/runs/${item.latestRun.id}`}
          className="flex-1 bg-green-600 text-white px-4 py-3 rounded-full text-sm font-semibold text-center hover:bg-green-700 transition-all duration-200 hover:shadow-md"
        >
          播放转写
        </Link>
      ) : item.status === 'uploaded' || item.status === 'failed' ? (
        <button
          onClick={() => onManualTranscribe(item.id)}
          disabled={loading}
          className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-orange-600 transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '处理中...' : '开始转写'}
        </button>
      ) : item.status === 'transcribing' ? (
        <div className="flex-1 bg-gray-400 text-white px-4 py-3 rounded-full text-sm font-semibold text-center">
          转写中...
        </div>
      ) : null}
    </div>
  </div>
);

export default function UserDashboard() {
  const { user, accessToken, initializing, logout } = useAuth();
  const router = useRouter();
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('my-audio');
  const [error, setError] = React.useState(null);
  const [showUploadModal, setShowUploadModal] = React.useState(false);

  const loadData = React.useCallback(async ({ page: pageNum, q: query }) => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', pageNum.toString());
      params.set('pageSize', '10');
      if (query) params.set('q', query);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const url = baseUrl ? `${baseUrl}/api/audios?${params.toString()}` : `/api/audios?${params.toString()}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) {
        throw new Error('获取音频列表失败');
      }

      const data = await response.json();

      if (pageNum === 1) {
        setItems(data.items || []);
      } else {
        setItems(prev => [...prev, ...(data.items || [])]);
      }

      setHasMore(data.hasMore || false);
      setPage(pageNum);
    } catch (error) {
      console.error('Load data error:', error);
      setError(error.message || '获取音频列表失败');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  React.useEffect(() => {
    if (!user || !accessToken) return;
    if (activeTab === 'my-audio') {
      loadData({ page: 1, q: search });
    }
  }, [user, accessToken, loadData, search, activeTab]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadData({ page: 1, q: search });
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadData({ page: page + 1, q: search });
    }
  };

  const handleUploadComplete = (audioId) => {
    loadData({ page: 1, q: search });
  };

  const handleUploadError = (errorMessage) => {
    setError(`上传失败: ${errorMessage}`);
  };

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

  const handleManualTranscribe = async (audioId) => {
    if (!accessToken) return;

    try {
      setLoading(true);
      const base = process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      const response = await fetch(`${base}/api/audios/${audioId}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          engine: 'google-speech-v2',
          language: 'en-US',
          diarize: true,
          gapSec: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error('转写启动失败');
      }

      loadData({ page: 1, q: search });
    } catch (error) {
      setError(`转写启动失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            欢迎使用 LingoLoopAI
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            请先登录以访问您的音频文件和学习统计
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              立即登录
            </Link>
            <Link
              href="/register"
              className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              注册账号
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 导航栏 */}
      <nav className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-8">
          <button
            onClick={() => setActiveTab('my-audio')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'my-audio'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            我的音频
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'stats'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            学习统计
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'progress'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            学习进度
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">
            欢迎，{user.displayName || user.email}
          </span>
          <Link
            href="/subscription"
            className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
          >
            订阅
          </Link>
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {logoutLoading ? '退出中...' : '退出登录'}
          </button>
        </div>
      </nav>

      {/* 我的内容区域 */}
      {activeTab === 'my-audio' && (
        <div>
          <WelcomeSection user={user} onUpload={() => setShowUploadModal(true)} />

          <QuickStats items={items} />

          {/* 搜索栏 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <form onSubmit={handleSearch} className="flex space-x-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索音频文件..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                搜索
              </button>
            </form>
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto flex-shrink-0 text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* 音频列表 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {items.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {items.map((item) => (
                    <AudioCard
                      key={item.id}
                      item={item}
                      onViewDetails={() => router.push(`/audios/${item.id}`)}
                      onPlayTranscript={() => router.push(`/runs/${item.latestRun.id}`)}
                      onManualTranscribe={handleManualTranscribe}
                      loading={loading}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMore}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? '加载中...' : '加载更多'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  还没有上传任何音频文件
                </h3>
                <p className="text-gray-600 mb-6">
                  上传音频文件开始您的英语听力训练之旅
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors"
                >
                  📤 上传音频
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 学习统计页面 */}
      {activeTab === 'stats' && <LearningStats />}

      {/* 学习进度页面 */}
      {activeTab === 'progress' && <ProgressTracker />}

      {/* 音频上传模态框 */}
      <AudioUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        accessToken={accessToken}
        user={user}
        onUploadComplete={handleUploadComplete}
        onUploadError={handleUploadError}
      />
    </div>
  );
}