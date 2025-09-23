/**
 * Feature Modal Component
 * Shows detailed information about a specific feature
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FEATURES,
  FEATURE_CATEGORIES,
  getFeatureTutorial
} from '../../utils/featureUnlocking';

const FeatureModal = ({
  featureId,
  userProgress,
  isOpen,
  onClose,
  onUse,
  markFeatureAsUsed
}) => {
  const feature = useMemo(() => FEATURES[featureId], [featureId]);
  const category = useMemo(() => FEATURE_CATEGORIES[feature?.category], [feature]);

  if (!feature || !isOpen) return null;

  const isUnlocked = userProgress.unlockedFeatures?.includes(featureId);
  const isEnabled = isUnlocked || feature.level === 0;
  const hasUsed = userProgress.usedFeatures?.includes(featureId);

  const getRequirementStatus = () => {
    const requirements = feature.requirements || {};
    const status = [];

    Object.entries(requirements).forEach(([key, value]) => {
      let current = 0;
      let required = value;
      let label = '';
      let isMet = false;

      switch (key) {
        case 'minSessions':
          current = userProgress.totalSessions || 0;
          isMet = current >= required;
          label = `完成学习会话`;
          break;
        case 'minListeningTime':
          current = userProgress.totalListeningTime || 0;
          required = Math.floor(required / 60000); // Convert to minutes
          current = Math.floor(current / 60000);
          isMet = (userProgress.totalListeningTime || 0) >= value;
          label = `累计听音时间 (分钟)`;
          break;
        case 'minSegmentsCompleted':
          current = userProgress.totalSegmentsCompleted || 0;
          isMet = current >= required;
          label = `完成学习片段`;
          break;
        case 'minFilesUploaded':
          current = userProgress.totalFilesUploaded || 0;
          isMet = current >= required;
          label = `上传文件数量`;
          break;
        case 'minFilesProcessed':
          current = userProgress.totalFilesProcessed || 0;
          isMet = current >= required;
          label = `处理文件数量`;
          break;
        case 'minAccuracy':
          current = Math.floor((userProgress.averageAccuracy || 0) * 100);
          required = Math.floor(required * 100);
          isMet = (userProgress.averageAccuracy || 0) >= value;
          label = `转录准确率 (%)`;
          break;
        case 'streakDays':
          current = userProgress.currentStreak || 0;
          isMet = current >= required;
          label = `连续学习天数`;
          break;
        case 'minShares':
          current = userProgress.totalShares || 0;
          isMet = current >= required;
          label = `分享学习成果`;
          break;
        case 'experienceLevel':
          current = userProgress.experienceLevel || 'beginner';
          isMet = current === required;
          label = `经验等级`;
          break;
        case 'subscription':
          current = userProgress.subscription || 'free';
          isMet = current === required;
          label = `订阅类型`;
          break;
        case 'achievement':
          current = userProgress.achievements || [];
          isMet = current.includes(required);
          label = `获得成就`;
          break;
        default:
          label = key;
          isMet = true;
      }

      status.push({
        key,
        label,
        current,
        required,
        isMet,
        progress: required > 0 ? Math.min(100, (current / required) * 100) : 100
      });
    });

    return status;
  };

  const requirementStatus = getRequirementStatus();

  const handleUseFeature = () => {
    onUse(featureId);
    if (!hasUsed) {
      markFeatureAsUsed(featureId);
    }
    onClose();
  };

  const getLevelLabel = () => {
    if (feature.level === 0) return '基础功能';
    if (feature.level === 'premium') return '高级功能';
    if (feature.level === 'special') return '特殊功能';
    return `等级 ${feature.level}`;
  };

  const getLevelColor = () => {
    if (feature.level === 0) return 'bg-gray-500';
    if (feature.level === 'premium') return 'bg-yellow-500';
    if (feature.level === 'special') return 'bg-pink-500';
    const colors = ['', 'bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
    return colors[feature.level] || 'bg-gray-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${getLevelColor()} bg-opacity-20`}>
                <span className="text-2xl">{category?.icon || '🔓'}</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{feature.name}</h2>
                <p className="text-gray-600">{feature.description}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    isEnabled
                      ? 'bg-green-100 text-green-800'
                      : isUnlocked
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isEnabled ? '已启用' : isUnlocked ? '已解锁' : '未解锁'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getLevelColor()} text-white`}>
                    {getLevelLabel()}
                  </span>
                  {hasUsed && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                      已使用
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Requirements */}
          {!isEnabled && requirementStatus.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">解锁要求</h3>
              <div className="space-y-3">
                {requirementStatus.map((req) => (
                  <div key={req.key} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${
                        req.isMet ? 'bg-green-500' : 'bg-gray-300'
                      }`}></div>
                      <span className="text-gray-700">{req.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full ${
                            req.isMet ? 'bg-green-500' : 'bg-blue-500'
                          } rounded-full`}
                          style={{ width: `${req.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 min-w-[80px] text-right">
                        {req.current} / {req.required}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feature Benefits */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">功能优势</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-blue-500">🎯</span>
                  <span className="font-medium text-blue-900">提升效率</span>
                </div>
                <p className="text-sm text-blue-700">通过智能化的功能设计，帮助你更高效地完成学习任务</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-green-500">📈</span>
                  <span className="font-medium text-green-900">进度追踪</span>
                </div>
                <p className="text-sm text-green-700">详细的学习数据分析，让你清楚了解自己的进步</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-purple-500">🎨</span>
                  <span className="font-medium text-purple-900">个性化</span>
                </div>
                <p className="text-sm text-purple-700">根据你的学习习惯和进度，提供个性化的学习建议</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-orange-500">🏆</span>
                  <span className="font-medium text-orange-900">成就感</span>
                </div>
                <p className="text-sm text-orange-700">通过解锁新功能，获得持续的学习动力和成就感</p>
              </div>
            </div>
          </div>

          {/* Tutorial */}
          {getFeatureTutorial(featureId) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">使用教程</h3>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-yellow-500">📚</span>
                  <span className="font-medium text-yellow-900">快速开始</span>
                </div>
                <p className="text-sm text-yellow-700">
                  查看详细的使用教程，快速掌握这个功能的全部特性
                </p>
                <button className="mt-2 px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm hover:bg-yellow-600 transition-colors">
                  查看教程
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">
              {category?.name} • {getLevelLabel()}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                关闭
              </button>
              {isEnabled && (
                <button
                  onClick={handleUseFeature}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {hasUsed ? '继续使用' : '开始使用'}
                </button>
              )}
              {isUnlocked && !isEnabled && (
                <button
                  onClick={handleUseFeature}
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  启用功能
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FeatureModal;