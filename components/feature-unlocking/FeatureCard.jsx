/**
 * Feature Card Component
 * Displays individual features with unlock status and progress
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const FeatureCard = ({
  feature,
  isUnlocked,
  isEnabled,
  progress = 0,
  onClick,
  onUse,
  showProgress = true,
  compact = false
}) => {
  const statusColor = useMemo(() => {
    if (isEnabled) return 'bg-green-500';
    if (isUnlocked) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-400';
  }, [isEnabled, isUnlocked, progress]);

  const statusText = useMemo(() => {
    if (isEnabled) return '已启用';
    if (isUnlocked) return '已解锁';
    if (progress > 0) return '解锁中';
    return '未解锁';
  }, [isEnabled, isUnlocked, progress]);

  const categoryIcon = useMemo(() => {
    const icons = {
      core: '🎵',
      playback: '▶️',
      analysis: '🧠',
      practice: '🎯',
      learning: '📚',
      analytics: '📈',
      ai: '🤖',
      social: '👥',
      productivity: '⚡',
      premium: '💎'
    };
    return icons[feature.category] || '🔓';
  }, [feature.category]);

  const levelLabel = useMemo(() => {
    if (feature.level === 0) return '基础';
    if (feature.level === 'premium') return '高级';
    if (feature.level === 'special') return '特殊';
    return `等级 ${feature.level}`;
  }, [feature.level]);

  if (compact) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
          isEnabled
            ? 'border-green-200 bg-green-50 hover:bg-green-100'
            : isUnlocked
            ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
            : progress > 0
            ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${statusColor} bg-opacity-20`}>
              <span className="text-sm">{categoryIcon}</span>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">{feature.name}</h4>
              <p className="text-xs text-gray-600">{feature.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showProgress && progress > 0 && progress < 100 && (
              <div className="text-xs text-gray-600 font-medium">
                {Math.floor(progress)}%
              </div>
            )}
            <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 rounded-2xl border-2 cursor-pointer transition-all ${
        isEnabled
          ? 'border-green-200 bg-green-50 hover:bg-green-100'
          : isUnlocked
          ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
          : progress > 0
          ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColor} bg-opacity-20`}>
            <span className="text-xl">{categoryIcon}</span>
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{feature.name}</h3>
            <p className="text-sm text-gray-600">{feature.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isEnabled
              ? 'bg-green-100 text-green-800'
              : isUnlocked
              ? 'bg-blue-100 text-blue-800'
              : progress > 0
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {statusText}
          </span>
          <span className="text-xs text-gray-500">
            {levelLabel}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      {showProgress && progress > 0 && progress < 100 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">解锁进度</span>
            <span className="text-sm text-gray-600">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isEnabled && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onUse(feature.id);
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
            >
              使用功能
            </motion.button>
          )}
          {isUnlocked && !isEnabled && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onUse(feature.id);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              启用功能
            </motion.button>
          )}
        </div>
        <div className="text-xs text-gray-500">
          点击查看详情
        </div>
      </div>

      {/* Locked Overlay */}
      {!isUnlocked && progress === 0 && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl mb-2">🔒</div>
            <p className="text-sm text-gray-600">需要解锁</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default FeatureCard;