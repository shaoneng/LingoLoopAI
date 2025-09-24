/**
 * Progressive Feature Unlocking Hook - Optimized Version
 * Simplified state management to prevent re-render loops
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  FEATURES,
  ACHIEVEMENTS,
  getVisibleFeatures,
  getEnabledFeatures,
  checkForNewUnlocks,
  getFeatureProgress,
  getNextUnlockableFeatures,
  getRecentlyUnlockedFeatures,
  getUnlockSuggestions
} from '../utils/featureUnlocking';

export const useFeatureUnlocking = (initialUserProgress) => {
  // Minimal essential states to prevent re-render loops
  const [userProgress, setUserProgress] = useState(initialUserProgress || {});
  const [isInitialized, setIsInitialized] = useState(false);

  // Use refs for state that doesn't need to trigger re-renders
  const stateRef = useRef({
    unlockedFeatures: [],
    achievements: [],
    visibleFeatures: [],
    enabledFeatures: [],
    recentUnlocks: [],
    nextUnlocks: [],
    suggestions: [],
    showUnlockNotification: false,
    currentUnlock: null,
    currentAchievement: null
  });

  // Ref to prevent duplicate processing
  const processingRef = useRef(false);
  const lastProgressRef = useRef(null);

  // Initialize user progress from localStorage - only runs once
  useEffect(() => {
    if (isInitialized) return;

    try {
      const storedProgress = localStorage.getItem('lingoloop.featureProgress');
      let progress;

      if (storedProgress) {
        progress = JSON.parse(storedProgress);
      } else {
        progress = {
          totalSessions: 0,
          totalListeningTime: 0,
          totalSegmentsCompleted: 0,
          totalFilesUploaded: 0,
          totalFilesProcessed: 0,
          averageAccuracy: 0,
          currentStreak: 0,
          totalShares: 0,
          experienceLevel: 'beginner',
          subscription: 'free',
          achievements: [],
          unlockedFeatures: [],
          usedFeatures: [],
          completedBasicTranscription: false
        };
        localStorage.setItem('lingoloop.featureProgress', JSON.stringify(progress));
      }

      setUserProgress(progress);
      setIsInitialized(true);
      lastProgressRef.current = progress;
    } catch (error) {
      console.error('Error initializing feature unlocking:', error);
      setIsInitialized(true);
    }
  }, []); // Empty dependency array - runs only once

  // Update derived states only when userProgress actually changes
  useEffect(() => {
    if (!isInitialized || !userProgress || processingRef.current) return;

    // Prevent processing the same progress multiple times
    if (lastProgressRef.current === userProgress) return;
    lastProgressRef.current = userProgress;

    // Use a flag to prevent recursive updates
    processingRef.current = true;

    try {
      // Calculate all derived states
      const visible = getVisibleFeatures(userProgress);
      const enabled = getEnabledFeatures(userProgress);
      const recent = getRecentlyUnlockedFeatures(userProgress);
      const next = getNextUnlockableFeatures(userProgress);
      const suggest = getUnlockSuggestions(userProgress);
      const { newUnlocks, newAchievements } = checkForNewUnlocks(userProgress);

      // Update ref state (doesn't trigger re-renders)
      const currentState = stateRef.current;
      currentState.visibleFeatures = visible;
      currentState.enabledFeatures = enabled;
      currentState.recentUnlocks = recent;
      currentState.nextUnlocks = next;
      currentState.suggestions = suggest;

      // Handle unlocks and achievements
      if (newUnlocks.length > 0 || newAchievements.length > 0) {
        const updatedUnlocks = [...(userProgress.unlockedFeatures || []), ...newUnlocks.map(f => f.id)];
        const updatedAchievements = [...(userProgress.achievements || []), ...newAchievements.map(a => a.id)];

        currentState.unlockedFeatures = updatedUnlocks;
        currentState.achievements = updatedAchievements;

        // Show notifications
        if (newUnlocks.length > 0) {
          currentState.currentUnlock = newUnlocks[0];
          currentState.showUnlockNotification = true;
        }

        if (newAchievements.length > 0) {
          currentState.currentAchievement = newAchievements[0];
          // Show achievement notification after a short delay
          setTimeout(() => {
            if (stateRef.current) {
              stateRef.current.showUnlockNotification = true;
            }
          }, 1000);
        }

        // Update localStorage
        try {
          localStorage.setItem('lingoloop.featureProgress', JSON.stringify({
            ...userProgress,
            unlockedFeatures: updatedUnlocks,
            achievements: updatedAchievements
          }));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }
      } else {
        currentState.unlockedFeatures = userProgress.unlockedFeatures || [];
        currentState.achievements = userProgress.achievements || [];
      }
    } catch (error) {
      console.error('Error updating feature states:', error);
    } finally {
      processingRef.current = false;
    }
  }, [userProgress, isInitialized]); // Only depends on essential states

  // Optimized update functions
  const updateUserProgress = useCallback((newProgress) => {
    setUserProgress(prevProgress => {
      const updatedProgress = {
        ...prevProgress,
        ...newProgress
      };

      // Update localStorage
      try {
        localStorage.setItem('lingoloop.featureProgress', JSON.stringify(updatedProgress));
      } catch (error) {
        console.error('Error updating localStorage:', error);
      }

      return updatedProgress;
    });
  }, []);

  const markFeatureAsUsed = useCallback((featureId) => {
    setUserProgress(prevProgress => {
      const usedFeatures = prevProgress.usedFeatures || [];
      if (!usedFeatures.includes(featureId)) {
        const updatedProgress = {
          ...prevProgress,
          usedFeatures: [...usedFeatures, featureId]
        };

        try {
          localStorage.setItem('lingoloop.featureProgress', JSON.stringify(updatedProgress));
        } catch (error) {
          console.error('Error updating localStorage:', error);
        }

        return updatedProgress;
      }
      return prevProgress;
    });
  }, []);

  // Get current state from refs - these are stable and don't cause re-renders
  const getCurrentState = useCallback(() => {
    return {
      unlockedFeatures: stateRef.current.unlockedFeatures,
      achievements: stateRef.current.achievements,
      visibleFeatures: stateRef.current.visibleFeatures,
      enabledFeatures: stateRef.current.enabledFeatures,
      recentUnlocks: stateRef.current.recentUnlocks,
      nextUnlocks: stateRef.current.nextUnlocks,
      suggestions: stateRef.current.suggestions,
      showUnlockNotification: stateRef.current.showUnlockNotification,
      currentUnlock: stateRef.current.currentUnlock,
      currentAchievement: stateRef.current.currentAchievement
    };
  }, []);

  // Optimized feature state calculation
  const getFeatureState = useCallback((featureId) => {
    const currentState = getCurrentState();
    const feature = FEATURES[featureId];

    if (!feature) return { isVisible: false, isEnabled: false, isUnlocked: false };

    const isUnlocked = currentState.unlockedFeatures.includes(featureId);
    const isVisible = currentState.visibleFeatures.some(f => f.id === featureId);
    const isEnabled = currentState.enabledFeatures.some(f => f.id === featureId);

    return {
      isVisible,
      isEnabled,
      isUnlocked,
      feature,
      progress: getFeatureProgress(feature, userProgress || {})
    };
  }, [getCurrentState, userProgress]);

  // Stable callbacks that don't change
  const closeUnlockNotification = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.showUnlockNotification = false;
      stateRef.current.currentUnlock = null;
      stateRef.current.currentAchievement = null;
    }
  }, []);

  const dismissUnlock = useCallback(() => {
    if (stateRef.current) {
      stateRef.current.showUnlockNotification = false;
      if (stateRef.current.currentUnlock) {
        stateRef.current.currentUnlock = null;
      }
      if (stateRef.current.currentAchievement) {
        stateRef.current.currentAchievement = null;
      }
    }
  }, []);

  // Memoized summaries
  const progressSummary = useMemo(() => {
    const currentState = getCurrentState();
    const totalFeatures = Object.values(FEATURES).filter(f => f.level !== 0 && f.level !== 'premium').length;
    const unlockedCount = currentState.unlockedFeatures.length;
    const achievementCount = currentState.achievements.length;
    const totalAchievements = Object.keys(ACHIEVEMENTS).length;

    const progressPercentage = totalFeatures > 0 ? (unlockedCount / totalFeatures) * 100 : 0;
    const achievementPercentage = totalAchievements > 0 ? (achievementCount / totalAchievements) * 100 : 0;

    return {
      totalFeatures,
      unlockedFeatures: unlockedCount,
      featureProgress: progressPercentage,
      totalAchievements,
      unlockedAchievements: achievementCount,
      achievementProgress: achievementPercentage,
      nextUnlocks: currentState.nextUnlocks.length,
      recentUnlocks: currentState.recentUnlocks.length
    };
  }, [getCurrentState]);

  const getFeaturesByCategory = useCallback((category) => {
    const currentState = getCurrentState();
    return currentState.visibleFeatures.filter(feature => {
      const featureState = getFeatureState(feature.id);
      return feature.category === category && featureState.isVisible;
    });
  }, [getCurrentState, getFeatureState]);

  // Return stable interface
  return {
    // State getters (stable)
    unlockedFeatures: getCurrentState().unlockedFeatures,
    achievements: getCurrentState().achievements,
    visibleFeatures: getCurrentState().visibleFeatures,
    enabledFeatures: getCurrentState().enabledFeatures,
    recentUnlocks: getCurrentState().recentUnlocks,
    nextUnlocks: getCurrentState().nextUnlocks,
    suggestions: getCurrentState().suggestions,
    showUnlockNotification: getCurrentState().showUnlockNotification,
    currentUnlock: getCurrentState().currentUnlock,
    currentAchievement: getCurrentState().currentAchievement,
    userProgress,

    // Memoized summaries
    progressSummary,

    // Actions (stable)
    markFeatureAsUsed,
    updateUserProgress,
    closeUnlockNotification,
    dismissUnlock,

    // Queries (stable)
    getFeatureState,
    isFeatureUnlocked: useCallback((featureId) => getCurrentState().unlockedFeatures.includes(featureId), [getCurrentState]),
    canUseFeature: useCallback((featureId) => getCurrentState().enabledFeatures.some(f => f.id === featureId), [getCurrentState]),
    getFeaturesByCategory,
    getProgressSummary: useCallback(() => progressSummary, [progressSummary]),
    getFeatureUnlockPath: useCallback((featureId) => {
      const feature = FEATURES[featureId];
      if (!feature) return [];

      const requirements = feature.requirements || {};
      const path = [];

      Object.entries(requirements).forEach(([key, value]) => {
        const requirementLabels = {
          minSessions: `完成 ${value} 个学习会话`,
          minListeningTime: `累计听音 ${Math.floor(value / 60000)} 分钟`,
          minSegmentsCompleted: `完成 ${value} 个学习片段`,
          minFilesUploaded: `上传 ${value} 个文件`,
          minFilesProcessed: `处理 ${value} 个文件`,
          minAccuracy: `达到 ${Math.floor(value * 100)}% 准确率`,
          streakDays: `连续学习 ${value} 天`,
          minShares: `分享 ${value} 次学习成果`,
          experienceLevel: `达到 ${value} 等级`,
          subscription: `订阅 ${value} 版本`,
          achievement: `获得 "${ACHIEVEMENTS[value]?.name}" 成就`,
          completedBasicTranscription: '完成基础转录',
          usedBasicAnalysis: '使用基础分析功能',
          usedLoopPractice: '使用循环练习功能',
          usedAdvancedAnalysis: '使用高级分析功能',
          usedVocabularyBuilder: '使用词汇构建器',
          usedAllLevel3Features: '使用所有3级功能',
          unlockedFeatures: `解锁特定功能: ${value.join(', ')}`
        };

        path.push({
          requirement: key,
          label: requirementLabels[key] || key,
          value,
          completed: checkRequirements({ [key]: value }, userProgress || {})
        });
      });

      return path;
    }, [userProgress])
  };
};

// Helper function
const checkRequirements = (requirements, userProgress) => {
  if (!requirements || Object.keys(requirements).length === 0) {
    return true;
  }

  const checks = {
    minSessions: () => (userProgress.totalSessions || 0) >= requirements.minSessions,
    minListeningTime: () => (userProgress.totalListeningTime || 0) >= requirements.minListeningTime,
    minSegmentsCompleted: () => (userProgress.totalSegmentsCompleted || 0) >= requirements.minSegmentsCompleted,
    minFilesUploaded: () => (userProgress.totalFilesUploaded || 0) >= requirements.minFilesUploaded,
    minFilesProcessed: () => (userProgress.totalFilesProcessed || 0) >= requirements.minFilesProcessed,
    minAccuracy: () => (userProgress.averageAccuracy || 0) >= requirements.minAccuracy,
    streakDays: () => (userProgress.currentStreak || 0) >= requirements.streakDays,
    minShares: () => (userProgress.totalShares || 0) >= requirements.minShares,
    experienceLevel: () => userProgress.experienceLevel === requirements.experienceLevel,
    subscription: () => userProgress.subscription === requirements.subscription,
    achievement: () => userProgress.achievements?.includes(requirements.achievement),
    completedBasicTranscription: () => userProgress.completedBasicTranscription,
    usedBasicAnalysis: () => userProgress.usedFeatures?.includes('basic-analysis'),
    usedLoopPractice: () => userProgress.usedFeatures?.includes('loop-practice'),
    usedAdvancedAnalysis: () => userProgress.usedFeatures?.includes('advanced-analysis'),
    usedVocabularyBuilder: () => userProgress.usedFeatures?.includes('vocabulary-builder'),
    usedAllLevel3Features: () => {
      const level3Features = Object.values(FEATURES).filter(f => f.level === 3).map(f => f.id);
      return level3Features.every(featureId =>
        userProgress.usedFeatures?.includes(featureId)
      );
    },
    unlockedFeatures: () => {
      if (!requirements.unlockedFeatures) return true;
      return requirements.unlockedFeatures.every(featureId =>
        userProgress.unlockedFeatures?.includes(featureId)
      );
    }
  };

  for (const [key, value] of Object.entries(requirements)) {
    if (checks[key] && !checks[key]()) {
      return false;
    }
  }

  return true;
};