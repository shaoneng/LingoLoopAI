/**
 * Features Page
 * Displays all available features with unlock status and progress
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureUnlocking } from '../hooks/useFeatureUnlocking';
import { FEATURES, FEATURE_CATEGORIES } from '../utils/featureUnlocking';
import FeatureCard from '../components/feature-unlocking/FeatureCard';
import FeatureRoadmap from '../components/feature-unlocking/FeatureRoadmap';
import FeatureModal from '../components/feature-unlocking/FeatureModal';
import FeatureUnlockNotification from '../components/feature-unlocking/FeatureUnlockNotification';

const FeaturesPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'roadmap'

  const {
    unlockedFeatures,
    achievements,
    visibleFeatures,
    enabledFeatures,
    recentUnlocks,
    nextUnlocks,
    suggestions,
    showUnlockNotification,
    currentUnlock,
    currentAchievement,
    userProgress,
    markFeatureAsUsed,
    updateUserProgress,
    closeUnlockNotification,
    dismissUnlock,
    getFeatureState,
    isFeatureUnlocked,
    canUseFeature,
    getProgressSummary,
    getFeaturesByCategory
  } = useFeatureUnlocking();

  const handleFeatureClick = (featureId) => {
    setSelectedFeature(featureId);
  };

  const handleFeatureUse = (featureId) => {
    console.log(`Using feature: ${featureId}`);
    // In a real app, this would navigate to the feature or open it
  };

  const handleModalClose = () => {
    setSelectedFeature(null);
  };

  const progressSummary = getProgressSummary();

  const filteredFeatures = selectedCategory === 'all'
    ? visibleFeatures
    : getFeaturesByCategory(selectedCategory);

  // Simulate progress updates (for demonstration)
  const simulateProgress = () => {
    const newProgress = {
      ...userProgress,
      totalSessions: (userProgress.totalSessions || 0) + 1,
      totalListeningTime: (userProgress.totalListeningTime || 0) + 300000, // 5 minutes
      totalSegmentsCompleted: (userProgress.totalSegmentsCompleted || 0) + 5,
      totalFilesUploaded: (userProgress.totalFilesUploaded || 0) + 1,
      totalFilesProcessed: (userProgress.totalFilesProcessed || 0) + 1,
      averageAccuracy: Math.min(1, (userProgress.averageAccuracy || 0) + 0.1)
    };

    // Simulate some basic achievements
    if (newProgress.totalSessions >= 3) {
      newProgress.currentStreak = 3;
    }

    if (newProgress.totalSessions >= 1 && !newProgress.completedBasicTranscription) {
      newProgress.completedBasicTranscription = true;
    }

    if (newProgress.totalFilesUploaded >= 1) {
      newProgress.achievements = [...(newProgress.achievements || []), 'first-steps'];
    }

    updateUserProgress(newProgress);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">功能中心</h1>
              <p className="text-gray-600 mt-1">探索和管理你的学习功能</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'roadmap' : 'grid')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {viewMode === 'grid' ? '路线图视图' : '网格视图'}
              </button>
              <button
                onClick={simulateProgress}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                模拟进度
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已解锁功能</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressSummary.unlockedFeatures} / {progressSummary.totalFeatures}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🔓</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${progressSummary.featureProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{Math.floor(progressSummary.featureProgress)}% 完成</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">获得成就</p>
                <p className="text-2xl font-bold text-gray-900">
                  {progressSummary.unlockedAchievements} / {progressSummary.totalAchievements}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🏆</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${progressSummary.achievementProgress}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{Math.floor(progressSummary.achievementProgress)}% 完成</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">即将解锁</p>
                <p className="text-2xl font-bold text-gray-900">{progressSummary.nextUnlocks}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🚀</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4">继续学习以解锁更多功能</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">最近解锁</p>
                <p className="text-2xl font-bold text-gray-900">{progressSummary.recentUnlocks}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">✨</span>
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-4">最近7天内解锁的功能</p>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div>
            {/* Category Filter */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 overflow-x-auto">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  全部功能 ({visibleFeatures.length})
                </button>
                {Object.entries(FEATURE_CATEGORIES).map(([key, category]) => {
                  const categoryFeatures = getFeaturesByCategory(key);
                  if (categoryFeatures.length === 0) return null;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center space-x-2 ${
                        selectedCategory === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>{category.icon}</span>
                      <span>{category.name} ({categoryFeatures.length})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFeatures.map((feature) => {
                const featureState = getFeatureState(feature.id);
                return (
                  <FeatureCard
                    key={feature.id}
                    feature={feature}
                    isUnlocked={featureState.isUnlocked}
                    isEnabled={featureState.isEnabled}
                    progress={featureState.progress?.progress || 0}
                    onClick={() => handleFeatureClick(feature.id)}
                    onUse={handleFeatureUse}
                  />
                );
              })}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">解锁建议</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{suggestion.feature.name}</h4>
                        <span className="text-sm text-yellow-600 font-medium">
                          {Math.floor(suggestion.progress)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{suggestion.feature.description}</p>
                      {suggestion.nextStep && (
                        <div className="text-xs text-gray-500">
                          下一步: {suggestion.nextStep.label} ({suggestion.nextStep.current}/{suggestion.nextStep.required})
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <FeatureRoadmap
            userProgress={userProgress}
            onFeatureClick={handleFeatureClick}
          />
        )}
      </div>

      {/* Feature Modal */}
      <FeatureModal
        featureId={selectedFeature}
        userProgress={userProgress}
        isOpen={!!selectedFeature}
        onClose={handleModalClose}
        onUse={handleFeatureUse}
        markFeatureAsUsed={markFeatureAsUsed}
      />

      {/* Unlock Notification */}
      <FeatureUnlockNotification
        showUnlockNotification={showUnlockNotification}
        currentUnlock={currentUnlock}
        currentAchievement={currentAchievement}
        onClose={closeUnlockNotification}
        onDismiss={dismissUnlock}
      />
    </div>
  );
};

export default FeaturesPage;