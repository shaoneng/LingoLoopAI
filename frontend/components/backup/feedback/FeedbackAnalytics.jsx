/**
 * Feedback Analytics Component
 * Displays feedback statistics and insights
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FEEDBACK_TYPES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES
} from '../../utils/userFeedback';

const FeedbackAnalytics = ({ feedbackHistory, sessionData }) => {
  const analytics = useMemo(() => {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentFeedback = feedbackHistory.filter(f => new Date(f.createdAt) > last30Days);
    const veryRecentFeedback = feedbackHistory.filter(f => new Date(f.createdAt) > last7Days);

    // Type distribution
    const typeDistribution = {};
    Object.values(FEEDBACK_TYPES).forEach(type => {
      typeDistribution[type] = recentFeedback.filter(f => f.type === type).length;
    });

    // Category distribution
    const categoryDistribution = {};
    Object.values(FEEDBACK_CATEGORIES).forEach(category => {
      categoryDistribution[category] = recentFeedback.filter(f => f.category === category).length;
    });

    // Priority distribution
    const priorityDistribution = {};
    Object.values(FEEDBACK_PRIORITIES).forEach(priority => {
      priorityDistribution[priority] = recentFeedback.filter(f => f.priority === priority).length;
    });

    // Sentiment analysis
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    recentFeedback.forEach(f => {
      const sentiment = f.analysis?.sentiment || 'neutral';
      sentimentCounts[sentiment]++;
    });

    // Trend analysis
    const dailyCounts = {};
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyCounts[dateStr] = feedbackHistory.filter(f =>
        f.createdAt.startsWith(dateStr)
      ).length;
    }

    // Top issues
    const issueCount = {};
    recentFeedback.forEach(f => {
      if (f.type === FEEDBACK_TYPES.BUG_REPORT || f.type === FEEDBACK_TYPES.USABILITY_ISSUE) {
        const keywords = f.title.toLowerCase().split(' ');
        keywords.forEach(keyword => {
          issueCount[keyword] = (issueCount[keyword] || 0) + 1;
        });
      }
    });

    const topIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([word, count]) => ({ word, count }));

    // Response time analysis
    const responseTimes = feedbackHistory
      .filter(f => f.respondedAt)
      .map(f => {
        const created = new Date(f.createdAt);
        const responded = new Date(f.respondedAt);
        return responded - created;
      });

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    return {
      totalFeedback: feedbackHistory.length,
      recent30Days: recentFeedback.length,
      recent7Days: veryRecentFeedback.length,
      typeDistribution,
      categoryDistribution,
      priorityDistribution,
      sentimentCounts,
      dailyCounts,
      topIssues,
      avgResponseTime,
      responseRate: feedbackHistory.filter(f => f.respondedAt).length / feedbackHistory.length * 100 || 0
    };
  }, [feedbackHistory]);

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case FEEDBACK_PRIORITIES.CRITICAL: return 'bg-red-500';
      case FEEDBACK_PRIORITIES.HIGH: return 'bg-orange-500';
      case FEEDBACK_PRIORITIES.MEDIUM: return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">总反馈数</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.totalFeedback}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📝</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            过去30天: {analytics.recent30Days}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">响应率</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.responseRate.toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">✅</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            平均响应时间: {formatTime(analytics.avgResponseTime)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">用户满意度</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.sentimentCounts.positive > 0
                  ? ((analytics.sentimentCounts.positive / analytics.recent30Days) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-yellow-600 text-xl">😊</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            正面反馈: {analytics.sentimentCounts.positive}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">紧急问题</p>
              <p className="text-2xl font-bold text-gray-900">
                {analytics.priorityDistribution[FEEDBACK_PRIORITIES.CRITICAL] || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-red-600 text-xl">🚨</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            高优先级: {analytics.priorityDistribution[FEEDBACK_PRIORITIES.HIGH] || 0}
          </p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">反馈类型分布</h3>
          <div className="space-y-3">
            {Object.entries(analytics.typeDistribution)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => {
                const percentage = analytics.recent30Days > 0 ? (count / analytics.recent30Days) * 100 : 0;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 capitalize">
                      {type.replace('-', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">问题分类</h3>
          <div className="space-y-3">
            {Object.entries(analytics.categoryDistribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 6)
              .map(([category, count]) => {
                const percentage = analytics.recent30Days > 0 ? (count / analytics.recent30Days) * 100 : 0;
                return (
                  <div key={category} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {category.replace('-', ' ')}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Top Issues */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-xl shadow-sm"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">热门问题关键词</h3>
        <div className="flex flex-wrap gap-2">
          {analytics.topIssues.map((issue, index) => (
            <div
              key={issue.word}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
            >
              {issue.word} ({issue.count})
            </div>
          ))}
          {analytics.topIssues.length === 0 && (
            <p className="text-gray-500 text-sm">暂无数据</p>
          )}
        </div>
      </motion.div>

      {/* Session Analytics */}
      {sessionData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">会话分析</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{sessionData.eventCount}</p>
              <p className="text-sm text-gray-600">总事件数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{sessionData.pageViewCount}</p>
              <p className="text-sm text-gray-600">页面浏览</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{sessionData.featureUsageCount}</p>
              <p className="text-sm text-gray-600">功能使用</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{sessionData.errorCount}</p>
              <p className="text-sm text-gray-600">错误数量</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FeedbackAnalytics;