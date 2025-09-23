/**
 * Feedback Dashboard Page
 * Comprehensive feedback management and analytics interface
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useUserFeedback } from '../hooks/useUserFeedback';
import FeedbackModal from '../components/feedback/FeedbackModal';
import SurveyModal from '../components/feedback/SurveyModal';
import FeedbackButton from '../components/feedback/FeedbackButton';
import FeedbackAnalytics from '../components/feedback/FeedbackAnalytics';

const FeedbackDashboard = () => {
  const { user } = useAuth();
  const {
    feedbackHistory,
    activeSurveys,
    showFeedbackModal,
    showSurvey,
    feedbackPreferences,
    isSubmitting,
    submitFeedback,
    submitSurvey,
    openFeedbackModal,
    closeFeedbackModal,
    cancelSurvey,
    updateFeedbackPreferences,
    getFeedbackStats,
    getSessionData
  } = useUserFeedback(user?.id);

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);

  const feedbackStats = getFeedbackStats();
  const sessionData = getSessionData();

  useEffect(() => {
    // Load analytics data
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    // In a real app, this would fetch from backend
    // For now, we'll use the available data
    setAnalyticsData({
      feedbackHistory,
      sessionData
    });
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    const result = await submitFeedback(feedbackData);
    return result.success;
  };

  const handleSurveySubmit = async (surveyId, responses) => {
    const result = await submitSurvey(surveyId, responses);
    return result.success;
  };

  const handleQuickFeedback = (type) => {
    openFeedbackModal({ type });
  };

  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😞';
      default: return '😐';
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      'bug-report': '🐛',
      'feature-request': '✨',
      'usability-issue': '🎨',
      'performance-issue': '⚡',
      'content-feedback': '📚',
      'general-feedback': '💭',
      'rating': '⭐',
      'suggestion': '💡',
      'error-report': '🚨'
    };
    return icons[type] || '📝';
  };

  const getStatusBadge = (status) => {
    const badges = {
      'open': { label: '待处理', color: 'bg-yellow-100 text-yellow-800' },
      'in-progress': { label: '处理中', color: 'bg-blue-100 text-blue-800' },
      'reviewing': { label: '审核中', color: 'bg-purple-100 text-purple-800' },
      'resolved': { label: '已解决', color: 'bg-green-100 text-green-800' },
      'closed': { label: '已关闭', color: 'bg-gray-100 text-gray-800' }
    };
    const badge = badges[status] || badges.open;
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>{badge.label}</span>;
  };

  const tabs = [
    { id: 'overview', label: '概览', icon: '📊' },
    { id: 'feedback', label: '反馈记录', icon: '📝' },
    { id: 'analytics', label: '数据分析', icon: '📈' },
    { id: 'settings', label: '设置', icon: '⚙️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">反馈中心</h1>
              <p className="text-gray-600 mt-1">管理用户反馈和数据分析</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {feedbackStats.totalSubmitted} 条反馈
              </div>
              <button
                onClick={openFeedbackModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                提交反馈
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">待处理</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedbackHistory.filter(f => f.status === 'open').length}
                </p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600">⏳</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">平均评分</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedbackStats.averageRating.toFixed(1)}
                </p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">⭐</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃调查</p>
                <p className="text-2xl font-bold text-gray-900">{activeSurveys.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">满意度</p>
                <p className="text-2xl font-bold text-gray-900">
                  {feedbackStats.preferences.feedbackScore}/5
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600">😊</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Recent Feedback */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">最近反馈</h3>
                  <div className="space-y-3">
                    {feedbackHistory.slice(-5).reverse().map((feedback) => (
                      <motion.div
                        key={feedback.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{getTypeIcon(feedback.type)}</span>
                          <div>
                            <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {feedback.analysis?.sentiment && (
                            <span className="text-lg">
                              {getSentimentEmoji(feedback.analysis.sentiment)}
                            </span>
                          )}
                          {getStatusBadge(feedback.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => openFeedbackModal({ type: 'bug-report' })}
                      className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">🐛</div>
                      <div className="font-medium text-red-900">报告错误</div>
                    </button>
                    <button
                      onClick={() => openFeedbackModal({ type: 'feature-request' })}
                      className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">✨</div>
                      <div className="font-medium text-blue-900">请求功能</div>
                    </button>
                    <button
                      onClick={() => openFeedbackModal({ type: 'rating' })}
                      className="p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">⭐</div>
                      <div className="font-medium text-yellow-900">评分</div>
                    </button>
                    <button
                      onClick={() => openFeedbackModal({ type: 'suggestion' })}
                      className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <div className="text-2xl mb-2">💡</div>
                      <div className="font-medium text-green-900">建议</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'feedback' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">所有反馈</h3>
                  <div className="text-sm text-gray-600">
                    共 {feedbackHistory.length} 条反馈
                  </div>
                </div>

                <div className="space-y-3">
                  {feedbackHistory.slice().reverse().map((feedback) => (
                    <motion.div
                      key={feedback.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedFeedback(feedback)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <span className="text-xl mt-1">{getTypeIcon(feedback.type)}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{feedback.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {feedback.message}
                            </p>
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                              <span className="capitalize">{feedback.type.replace('-', ' ')}</span>
                              <span className="capitalize">{feedback.category.replace('-', ' ')}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {feedback.analysis?.sentiment && (
                            <span className="text-lg">
                              {getSentimentEmoji(feedback.analysis.sentiment)}
                            </span>
                          )}
                          {getStatusBadge(feedback.status)}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <FeedbackAnalytics
                feedbackHistory={feedbackHistory}
                sessionData={sessionData}
              />
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">反馈设置</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">启用数据分析</h4>
                        <p className="text-sm text-gray-600">收集使用数据以改进产品体验</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feedbackPreferences.enableAnalytics}
                          onChange={(e) => updateFeedbackPreferences({ enableAnalytics: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">启用反馈收集</h4>
                        <p className="text-sm text-gray-600">允许发送反馈请求和调查</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={feedbackPreferences.enableFeedbackCollection}
                          onChange={(e) => updateFeedbackPreferences({ enableFeedbackCollection: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="block font-medium text-gray-900 mb-2">调查频率</label>
                      <select
                        value={feedbackPreferences.surveyFrequency}
                        onChange={(e) => updateFeedbackPreferences({ surveyFrequency: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">低 (30天)</option>
                        <option value="medium">中 (14天)</option>
                        <option value="high">高 (7天)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feedback Button */}
      <FeedbackButton
        onClick={handleQuickFeedback}
        unreadCount={feedbackStats.pendingInQueue}
      />

      {/* Modals */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={closeFeedbackModal}
        onSubmit={handleFeedbackSubmit}
        isSubmitting={isSubmitting}
      />

      <SurveyModal
        survey={showSurvey}
        isOpen={!!showSurvey}
        onClose={() => setShowSurvey(null)}
        onSubmit={handleSurveySubmit}
        onCancel={cancelSurvey}
      />
    </div>
  );
};

export default FeedbackDashboard;