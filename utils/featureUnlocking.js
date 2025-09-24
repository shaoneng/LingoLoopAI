/**
 * Progressive Feature Unlocking System
 * Manages feature availability based on user progress, achievements, and experience
 */

// Feature definitions with unlock criteria
export const FEATURES = {
  // Core Features (Always Available)
  BASIC_UPLOAD: {
    id: 'basic-upload',
    name: '基础上传',
    description: '上传音频文件进行转写',
    category: 'core',
    level: 0,
    requirements: {},
    isVisible: true,
    isEnabled: true,
    tutorial: 'basic-upload-tutorial'
  },

  BASIC_TRANSCRIPTION: {
    id: 'basic-transcription',
    name: '基础转写',
    description: '语音转文字功能',
    category: 'core',
    level: 0,
    requirements: {},
    isVisible: true,
    isEnabled: true,
    tutorial: 'basic-transcription-tutorial'
  },

  // Level 1 Features (Beginner)
  AUDIO_PLAYER: {
    id: 'audio-player',
    name: '音频播放器',
    description: '带同步高亮的音频播放器',
    category: 'playback',
    level: 1,
    requirements: {
      minSessions: 1,
      minListeningTime: 300000, // 5 minutes
      completedBasicTranscription: true
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'audio-player-tutorial'
  },

  BASIC_ANALYSIS: {
    id: 'basic-analysis',
    name: '基础分析',
    description: '句子结构和语法基础分析',
    category: 'analysis',
    level: 1,
    requirements: {
      minSessions: 2,
      minSegmentsCompleted: 10,
      minTranscriptionAccuracy: 0.7
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'basic-analysis-tutorial'
  },

  // Level 2 Features (Intermediate)
  ADVANCED_ANALYSIS: {
    id: 'advanced-analysis',
    name: '高级分析',
    description: '详细语法分析和翻译',
    category: 'analysis',
    level: 2,
    requirements: {
      minSessions: 5,
      minListeningTime: 1800000, // 30 minutes
      minSegmentsCompleted: 50,
      usedBasicAnalysis: true,
      experienceLevel: 'intermediate'
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'advanced-analysis-tutorial'
  },

  LOOP_PRACTICE: {
    id: 'loop-practice',
    name: '循环练习',
    description: '句子循环播放和跟读练习',
    category: 'practice',
    level: 2,
    requirements: {
      minSessions: 3,
      minListeningTime: 900000, // 15 minutes
      completedBasicTranscription: true
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'loop-practice-tutorial'
  },

  RECORDING: {
    id: 'recording',
    name: '录音功能',
    description: '录制自己的发音并进行对比',
    category: 'practice',
    level: 2,
    requirements: {
      minSessions: 4,
      minListeningTime: 1200000, // 20 minutes
      usedLoopPractice: true
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'recording-tutorial'
  },

  // Level 3 Features (Advanced)
  VOCABULARY_BUILDER: {
    id: 'vocabulary-builder',
    name: '词汇构建器',
    description: '个人词汇库和智能复习',
    category: 'learning',
    level: 3,
    requirements: {
      minSessions: 10,
      minListeningTime: 3600000, // 1 hour
      minSegmentsCompleted: 200,
      usedAdvancedAnalysis: true,
      experienceLevel: 'advanced'
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'vocabulary-builder-tutorial'
  },

  PROGRESS_TRACKING: {
    id: 'progress-tracking',
    name: '进度追踪',
    description: '详细学习进度和技能发展',
    category: 'analytics',
    level: 3,
    requirements: {
      minSessions: 8,
      minListeningTime: 2400000, // 40 minutes
      streakDays: 3
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'progress-tracking-tutorial'
  },

  CUSTOM_PRACTICE: {
    id: 'custom-practice',
    name: '自定义练习',
    description: '创建个性化学习计划',
    category: 'practice',
    level: 3,
    requirements: {
      minSessions: 12,
      minListeningTime: 4800000, // 80 minutes
      usedVocabularyBuilder: true
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'custom-practice-tutorial'
  },

  // Level 4 Features (Expert)
  AI_TUTOR: {
    id: 'ai-tutor',
    name: 'AI导师',
    description: '个性化学习指导和智能建议',
    category: 'ai',
    level: 4,
    requirements: {
      minSessions: 20,
      minListeningTime: 7200000, // 2 hours
      minSegmentsCompleted: 500,
      usedAllLevel3Features: true,
      experienceLevel: 'expert'
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'ai-tutor-tutorial'
  },

  COLLABORATIVE_LEARNING: {
    id: 'collaborative-learning',
    name: '协作学习',
    description: '与其他学习者分享和讨论',
    category: 'social',
    level: 4,
    requirements: {
      minSessions: 15,
      minListeningTime: 5400000, // 90 minutes
      experienceLevel: 'expert',
      minAccuracy: 0.85
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'collaborative-learning-tutorial'
  },

  // Special Features (Achievement-based)
  BATCH_PROCESSING: {
    id: 'batch-processing',
    name: '批量处理',
    description: '同时处理多个音频文件',
    category: 'productivity',
    level: 'special',
    requirements: {
      achievement: 'power-user',
      minFilesProcessed: 50
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'batch-processing-tutorial'
  },

  EXPORT_FEATURES: {
    id: 'export-features',
    name: '导出功能',
    description: '导出转写结果和学习数据',
    category: 'productivity',
    level: 'special',
    requirements: {
      achievement: 'data-enthusiast',
      minSessions: 25
    },
    isVisible: false,
    isEnabled: false,
    tutorial: 'export-features-tutorial'
  },

  // Premium Features (Subscription-based)
  PREMIUM_MODELS: {
    id: 'premium-models',
    name: '高级模型',
    description: '使用更准确的语音识别和AI分析模型',
    category: 'premium',
    level: 'premium',
    requirements: {
      subscription: 'premium'
    },
    isVisible: true,
    isEnabled: false,
    tutorial: 'premium-models-tutorial'
  },

  UNLIMITED_STORAGE: {
    id: 'unlimited-storage',
    name: '无限存储',
    description: '无限制的音频文件存储空间',
    category: 'premium',
    level: 'premium',
    requirements: {
      subscription: 'premium'
    },
    isVisible: true,
    isEnabled: false,
    tutorial: 'unlimited-storage-tutorial'
  }
};

// Achievement definitions
export const ACHIEVEMENTS = {
  'first-steps': {
    id: 'first-steps',
    name: '第一步',
    description: '完成第一次音频上传',
    icon: '🎯',
    requirements: {
      minFilesUploaded: 1
    },
    unlocks: ['audio-player']
  },

  'early-adopter': {
    id: 'early-adopter',
    name: '早期采用者',
    description: '连续使用3天',
    icon: '🌟',
    requirements: {
      streakDays: 3
    },
    unlocks: ['progress-tracking']
  },

  'dedicated-learner': {
    id: 'dedicated-learner',
    name: '专注学习者',
    description: '累计学习时间超过1小时',
    icon: '⏰',
    requirements: {
      minListeningTime: 3600000 // 1 hour
    },
    unlocks: ['vocabulary-builder']
  },

  'power-user': {
    id: 'power-user',
    name: '超级用户',
    description: '处理超过50个音频文件',
    icon: '⚡',
    requirements: {
      minFilesProcessed: 50
    },
    unlocks: ['batch-processing']
  },

  'perfectionist': {
    id: 'perfectionist',
    name: '完美主义者',
    description: '转录准确率达到90%以上',
    icon: '🎪',
    requirements: {
      minAccuracy: 0.9
    },
    unlocks: ['recording']
  },

  'social-butterfly': {
    id: 'social-butterfly',
    name: '社交达人',
    description: '分享5个学习成果',
    icon: '🦋',
    requirements: {
      minShares: 5
    },
    unlocks: ['collaborative-learning']
  },

  'data-enthusiast': {
    id: 'data-enthusiast',
    name: '数据爱好者',
    description: '完成25个学习会话',
    icon: '📊',
    requirements: {
      minSessions: 25
    },
    unlocks: ['export-features']
  },

  'master-learner': {
    id: 'master-learner',
    name: '学习大师',
    description: '解锁所有主要功能',
    icon: '🏆',
    requirements: {
      unlockedFeatures: ['audio-player', 'advanced-analysis', 'vocabulary-builder', 'ai-tutor']
    },
    unlocks: ['custom-practice']
  }
};

// Feature categories for organization
export const FEATURE_CATEGORIES = {
  core: {
    name: '核心功能',
    description: '基础转写和上传功能',
    icon: '🎵'
  },
  playback: {
    name: '播放功能',
    description: '音频播放和控制',
    icon: '▶️'
  },
  analysis: {
    name: '分析功能',
    description: 'AI驱动的语言分析',
    icon: '🧠'
  },
  practice: {
    name: '练习功能',
    description: '互动学习工具',
    icon: '🎯'
  },
  learning: {
    name: '学习工具',
    description: '个性化学习功能',
    icon: '📚'
  },
  analytics: {
    name: '数据分析',
    description: '学习进度和统计',
    icon: '📈'
  },
  ai: {
    name: 'AI功能',
    description: '智能学习助手',
    icon: '🤖'
  },
  social: {
    name: '社交功能',
    description: '协作和分享',
    icon: '👥'
  },
  productivity: {
    name: '效率工具',
    description: '提升工作效率',
    icon: '⚡'
  },
  premium: {
    name: '高级功能',
    description: '订阅专享功能',
    icon: '💎'
  }
};

// Utility functions
export const getFeatureById = (id) => {
  return FEATURES[id] || null;
};

export const getFeaturesByCategory = (category) => {
  return Object.values(FEATURES).filter(feature => feature.category === category);
};

export const getFeaturesByLevel = (level) => {
  return Object.values(FEATURES).filter(feature => feature.level === level);
};

export const getVisibleFeatures = (userProgress) => {
  return Object.values(FEATURES).filter(feature =>
    feature.isVisible || isFeatureVisible(feature, userProgress)
  );
};

export const getEnabledFeatures = (userProgress) => {
  return Object.values(FEATURES).filter(feature =>
    feature.isEnabled || isFeatureEnabled(feature, userProgress)
  );
};

export const getRecentlyUnlockedFeatures = (userProgress, days = 7) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return Object.values(FEATURES).filter(feature => {
    const unlockDate = userProgress.featureUnlocks?.[feature.id];
    return unlockDate && new Date(unlockDate) > cutoffDate;
  });
};

export const getNextUnlockableFeatures = (userProgress) => {
  return Object.values(FEATURES).filter(feature => {
    if (feature.level === 0 || feature.level === 'premium') return false;
    if (feature.isEnabled || isFeatureEnabled(feature, userProgress)) return false;
    if (!feature.isVisible && !isFeatureVisible(feature, userProgress)) return false;

    return isFeatureUnlockable(feature, userProgress);
  });
};

export const checkRequirements = (requirements, userProgress) => {
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
      const level3Features = getFeaturesByLevel(3).map(f => f.id);
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

export const isFeatureVisible = (feature, userProgress) => {
  if (feature.level === 0 || feature.level === 'premium') {
    return true;
  }

  if (userProgress.unlockedFeatures?.includes(feature.id)) {
    return true;
  }

  // Check if any requirements are met for visibility
  const requirements = feature.requirements || {};
  const visibilityThresholds = {
    minSessions: Math.floor((requirements.minSessions || 10) * 0.5),
    minListeningTime: Math.floor((requirements.minListeningTime || 300000) * 0.5),
    minSegmentsCompleted: Math.floor((requirements.minSegmentsCompleted || 20) * 0.5)
  };

  const partialRequirements = { ...requirements };
  Object.keys(visibilityThresholds).forEach(key => {
    if (partialRequirements[key]) {
      partialRequirements[key] = visibilityThresholds[key];
    }
  });

  return checkRequirements(partialRequirements, userProgress);
};

export const isFeatureEnabled = (feature, userProgress) => {
  if (feature.level === 0) {
    return true;
  }

  if (feature.level === 'premium') {
    return userProgress.subscription === 'premium';
  }

  if (userProgress.unlockedFeatures?.includes(feature.id)) {
    return true;
  }

  return checkRequirements(feature.requirements, userProgress);
};

export const isFeatureUnlockable = (feature, userProgress) => {
  if (feature.level === 0 || feature.level === 'premium') {
    return false;
  }

  if (userProgress.unlockedFeatures?.includes(feature.id)) {
    return false;
  }

  return checkRequirements(feature.requirements, userProgress);
};

export const getFeatureProgress = (feature, userProgress) => {
  if (feature.level === 0) {
    return { progress: 100, isUnlocked: true };
  }

  if (userProgress.unlockedFeatures?.includes(feature.id)) {
    return { progress: 100, isUnlocked: true };
  }

  const requirements = feature.requirements || {};
  const totalRequirements = Object.keys(requirements).length;

  if (totalRequirements === 0) {
    return { progress: 100, isUnlocked: true };
  }

  let metRequirements = 0;
  const progressDetails = {};

  const checks = {
    minSessions: () => {
      const current = userProgress.totalSessions || 0;
      const required = requirements.minSessions;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minSessions = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minListeningTime: () => {
      const current = userProgress.totalListeningTime || 0;
      const required = requirements.minListeningTime;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minListeningTime = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minSegmentsCompleted: () => {
      const current = userProgress.totalSegmentsCompleted || 0;
      const required = requirements.minSegmentsCompleted;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minSegmentsCompleted = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minFilesUploaded: () => {
      const current = userProgress.totalFilesUploaded || 0;
      const required = requirements.minFilesUploaded;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minFilesUploaded = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minFilesProcessed: () => {
      const current = userProgress.totalFilesProcessed || 0;
      const required = requirements.minFilesProcessed;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minFilesProcessed = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minAccuracy: () => {
      const current = userProgress.averageAccuracy || 0;
      const required = requirements.minAccuracy;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minAccuracy = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    streakDays: () => {
      const current = userProgress.currentStreak || 0;
      const required = requirements.streakDays;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.streakDays = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    minShares: () => {
      const current = userProgress.totalShares || 0;
      const required = requirements.minShares;
      const progress = Math.min(100, (current / required) * 100);
      progressDetails.minShares = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    experienceLevel: () => {
      const current = userProgress.experienceLevel;
      const required = requirements.experienceLevel;
      const progress = current === required ? 100 : 0;
      progressDetails.experienceLevel = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    subscription: () => {
      const current = userProgress.subscription;
      const required = requirements.subscription;
      const progress = current === required ? 100 : 0;
      progressDetails.subscription = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    achievement: () => {
      const current = userProgress.achievements || [];
      const required = requirements.achievement;
      const progress = current.includes(required) ? 100 : 0;
      progressDetails.achievement = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    completedBasicTranscription: () => {
      const current = userProgress.completedBasicTranscription;
      const required = requirements.completedBasicTranscription;
      const progress = current === required ? 100 : 0;
      progressDetails.completedBasicTranscription = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    usedBasicAnalysis: () => {
      const current = userProgress.usedFeatures || [];
      const required = requirements.usedBasicAnalysis;
      const progress = current.includes('basic-analysis') ? 100 : 0;
      progressDetails.usedBasicAnalysis = { current: current.includes('basic-analysis'), required, progress };
      if (progress >= 100) metRequirements++;
    },
    usedLoopPractice: () => {
      const current = userProgress.usedFeatures || [];
      const required = requirements.usedLoopPractice;
      const progress = current.includes('loop-practice') ? 100 : 0;
      progressDetails.usedLoopPractice = { current: current.includes('loop-practice'), required, progress };
      if (progress >= 100) metRequirements++;
    },
    usedAdvancedAnalysis: () => {
      const current = userProgress.usedFeatures || [];
      const required = requirements.usedAdvancedAnalysis;
      const progress = current.includes('advanced-analysis') ? 100 : 0;
      progressDetails.usedAdvancedAnalysis = { current: current.includes('advanced-analysis'), required, progress };
      if (progress >= 100) metRequirements++;
    },
    usedVocabularyBuilder: () => {
      const current = userProgress.usedFeatures || [];
      const required = requirements.usedVocabularyBuilder;
      const progress = current.includes('vocabulary-builder') ? 100 : 0;
      progressDetails.usedVocabularyBuilder = { current: current.includes('vocabulary-builder'), required, progress };
      if (progress >= 100) metRequirements++;
    },
    usedAllLevel3Features: () => {
      const level3Features = getFeaturesByLevel(3).map(f => f.id);
      const current = userProgress.usedFeatures || [];
      const required = true;
      const progress = level3Features.every(featureId => current.includes(featureId)) ? 100 : 0;
      progressDetails.usedAllLevel3Features = { current, required, progress };
      if (progress >= 100) metRequirements++;
    },
    unlockedFeatures: () => {
      if (!requirements.unlockedFeatures) {
        metRequirements++;
        return;
      }
      const current = userProgress.unlockedFeatures || [];
      const required = requirements.unlockedFeatures;
      const progress = required.every(featureId => current.includes(featureId)) ? 100 : 0;
      progressDetails.unlockedFeatures = { current, required, progress };
      if (progress >= 100) metRequirements++;
    }
  };

  Object.keys(requirements).forEach(key => {
    if (checks[key]) checks[key]();
  });

  const overallProgress = (metRequirements / totalRequirements) * 100;

  return {
    progress: overallProgress,
    isUnlocked: overallProgress >= 100,
    details: progressDetails,
    metRequirements,
    totalRequirements
  };
};

export const checkForNewUnlocks = (userProgress) => {
  const newUnlocks = [];
  const newAchievements = [];

  // Check for feature unlocks
  Object.values(FEATURES).forEach(feature => {
    if (!userProgress.unlockedFeatures?.includes(feature.id) &&
        isFeatureEnabled(feature, userProgress)) {
      newUnlocks.push(feature);
    }
  });

  // Check for achievements
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    if (!userProgress.achievements?.includes(achievement.id) &&
        checkRequirements(achievement.requirements, userProgress)) {
      newAchievements.push(achievement);
    }
  });

  return { newUnlocks, newAchievements };
};

export const getFeatureTutorial = (featureId) => {
  const feature = FEATURES[featureId];
  return feature?.tutorial || null;
};

export const getUnlockSuggestions = (userProgress) => {
  const suggestions = [];

  Object.values(FEATURES).forEach(feature => {
    if (feature.level === 0 || feature.level === 'premium') return;
    if (userProgress.unlockedFeatures?.includes(feature.id)) return;

    const progress = getFeatureProgress(feature, userProgress);
    if (progress.progress > 0 && progress.progress < 100) {
      suggestions.push({
        feature,
        progress: progress.progress,
        nextStep: getNextUnlockStep(feature, progress.details)
      });
    }
  });

  return suggestions.sort((a, b) => b.progress - a.progress).slice(0, 3);
};

const getNextUnlockStep = (feature, progressDetails) => {
  const requirements = feature.requirements || {};

  // Find the requirement with the lowest progress
  let lowestProgress = 100;
  let nextStep = null;

  Object.entries(progressDetails).forEach(([key, detail]) => {
    if (detail.progress < lowestProgress) {
      lowestProgress = detail.progress;
      nextStep = { requirement: key, ...detail };
    }
  });

  if (!nextStep) return null;

  const requirementLabels = {
    minSessions: '完成更多学习会话',
    minListeningTime: '增加听音时间',
    minSegmentsCompleted: '完成更多片段',
    minFilesUploaded: '上传更多文件',
    minFilesProcessed: '处理更多文件',
    minAccuracy: '提高转录准确率',
    streakDays: '保持连续学习',
    minShares: '分享学习成果',
    experienceLevel: '提升经验等级',
    subscription: '升级到高级版',
    achievement: '获得特定成就',
    completedBasicTranscription: '完成基础转录',
    usedBasicAnalysis: '使用基础分析功能',
    usedLoopPractice: '使用循环练习功能',
    usedAdvancedAnalysis: '使用高级分析功能',
    usedVocabularyBuilder: '使用词汇构建器',
    usedAllLevel3Features: '使用所有3级功能',
    unlockedFeatures: '解锁特定功能'
  };

  return {
    label: requirementLabels[nextStep.requirement] || '完成更多任务',
    current: nextStep.current,
    required: nextStep.required,
    progress: nextStep.progress
  };
};