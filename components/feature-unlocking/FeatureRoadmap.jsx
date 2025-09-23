/**
 * Feature Roadmap Component
 * Shows the progression path for feature unlocking
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FEATURES,
  FEATURE_CATEGORIES,
  getFeaturesByLevel
} from '../../utils/featureUnlocking';

const FeatureRoadmap = ({ userProgress, onFeatureClick }) => {
  const levels = useMemo(() => [
    { id: 0, name: '基础功能', description: '所有用户可用', color: 'gray' },
    { id: 1, name: '初级功能', description: '新手学习工具', color: 'green' },
    { id: 2, name: '中级功能', description: '进阶学习功能', color: 'blue' },
    { id: 3, name: '高级功能', description: '专业学习工具', color: 'purple' },
    { id: 4, name: '专家功能', description: '高级用户专享', color: 'orange' },
    { id: 'special', name: '特殊功能', description: '成就解锁', color: 'pink' },
    { id: 'premium', name: '高级功能', description: '订阅专享', color: 'yellow' }
  ], []);

  const getLevelFeatures = (levelId) => {
    return getFeaturesByLevel(levelId).map(feature => {
      const requirements = feature.requirements || {};
      const isCompleted = Object.keys(requirements).every(key => {
        const value = requirements[key];
        switch (key) {
          case 'minSessions':
            return (userProgress.totalSessions || 0) >= value;
          case 'minListeningTime':
            return (userProgress.totalListeningTime || 0) >= value;
          case 'minSegmentsCompleted':
            return (userProgress.totalSegmentsCompleted || 0) >= value;
          case 'minFilesUploaded':
            return (userProgress.totalFilesUploaded || 0) >= value;
          case 'minAccuracy':
            return (userProgress.averageAccuracy || 0) >= value;
          case 'streakDays':
            return (userProgress.currentStreak || 0) >= value;
          case 'experienceLevel':
            return userProgress.experienceLevel === value;
          case 'subscription':
            return userProgress.subscription === value;
          default:
            return true;
        }
      });

      return {
        ...feature,
        isCompleted,
        category: FEATURE_CATEGORIES[feature.category]
      };
    });
  };

  const getLevelProgress = (levelId) => {
    const features = getLevelFeatures(levelId);
    if (features.length === 0) return 100;
    const completedCount = features.filter(f => f.isCompleted).length;
    return (completedCount / features.length) * 100;
  };

  const isLevelUnlocked = (levelId) => {
    if (levelId === 0 || levelId === 'premium') return true;
    if (levelId === 'special') {
      return userProgress.achievements?.length > 0;
    }
    return getLevelProgress(levelId) > 0;
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">功能解锁路线图</h2>
        <p className="text-gray-600">随着你的学习进度，逐步解锁更强大的功能</p>
      </div>

      {/* Roadmap Path */}
      <div className="relative mb-8">
        {/* Progress Line */}
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-purple-500"
          />
        </div>

        {/* Level Nodes */}
        <div className="relative flex justify-between">
          {levels.map((level, index) => {
            const progress = getLevelProgress(level.id);
            const isUnlocked = isLevelUnlocked(level.id);
            const features = getLevelFeatures(level.id);

            return (
              <motion.div
                key={level.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center"
              >
                {/* Level Node */}
                <div className={`relative mb-4 ${!isUnlocked ? 'opacity-50' : ''}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg ${
                    level.id === 0 ? 'bg-gray-500' :
                    level.id === 1 ? 'bg-green-500' :
                    level.id === 2 ? 'bg-blue-500' :
                    level.id === 3 ? 'bg-purple-500' :
                    level.id === 4 ? 'bg-orange-500' :
                    level.id === 'special' ? 'bg-pink-500' :
                    'bg-yellow-500'
                  }`}>
                    {level.id === 0 ? '🎯' :
                     level.id === 1 ? '🌱' :
                     level.id === 2 ? '📚' :
                     level.id === 3 ? '🎓' :
                     level.id === 4 ? '🏆' :
                     level.id === 'special' ? '⭐' :
                     '💎'}
                  </div>
                  {progress > 0 && progress < 100 && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                      {Math.floor(progress)}%
                    </div>
                  )}
                </div>

                {/* Level Info */}
                <div className="text-center max-w-[120px]">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{level.name}</h3>
                  <p className="text-xs text-gray-600 mb-2">{level.description}</p>
                  <div className="text-xs text-gray-500">
                    {features.length} 个功能
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Level Details */}
      <div className="space-y-8">
        {levels.map((level) => {
          const features = getLevelFeatures(level.id);
          const progress = getLevelProgress(level.id);
          const isUnlocked = isLevelUnlocked(level.id);

          if (features.length === 0) return null;

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl p-6 ${
                !isUnlocked ? 'bg-gray-50' :
                level.id === 1 ? 'bg-green-50' :
                level.id === 2 ? 'bg-blue-50' :
                level.id === 3 ? 'bg-purple-50' :
                level.id === 4 ? 'bg-orange-50' :
                level.id === 'special' ? 'bg-pink-50' :
                'bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{level.name}</h3>
                  <p className="text-gray-600">{level.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{Math.floor(progress)}%</div>
                  <div className="text-sm text-gray-600">完成度</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={`h-full ${
                    level.id === 1 ? 'bg-green-500' :
                    level.id === 2 ? 'bg-blue-500' :
                    level.id === 3 ? 'bg-purple-500' :
                    level.id === 4 ? 'bg-orange-500' :
                    level.id === 'special' ? 'bg-pink-500' :
                    'bg-yellow-500'
                  } rounded-full`}
                />
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => (
                  <motion.div
                    key={feature.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      feature.isCompleted
                        ? 'border-green-200 bg-green-50 hover:bg-green-100'
                        : isUnlocked
                        ? 'border-yellow-200 bg-yellow-50 hover:bg-yellow-100'
                        : 'border-gray-200 bg-gray-100'
                    }`}
                    onClick={() => onFeatureClick(feature.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{feature.category?.icon || '🔓'}</span>
                        <h4 className="font-medium text-gray-900 text-sm">{feature.name}</h4>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        feature.isCompleted ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default FeatureRoadmap;