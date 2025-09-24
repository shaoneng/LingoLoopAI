/**
 * Adaptive user experience system
 * Provides personalized UI, content recommendations, and difficulty adjustments
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from './useAnalytics';
import { useUserPreferences } from './useUserPreferences';

/**
 * User experience levels based on skill and usage patterns
 */
const EXPERIENCE_LEVELS = {
  BEGINNER: {
    id: 'beginner',
    name: '初学者',
    description: '刚开始使用，需要更多指导',
    features: {
      guidedTours: true,
      simplifiedUI: true,
      progressiveDisclosure: true,
      enhancedHelp: true,
      basicFeaturesOnly: true
    },
    thresholds: {
      sessionCount: 0,
      totalHours: 0,
      completedAnalyses: 0,
      avgAccuracy: 0
    }
  },
  INTERMEDIATE: {
    id: 'intermediate',
    name: '中级用户',
    description: '有一定使用经验，探索更多功能',
    features: {
      guidedTours: false,
      simplifiedUI: false,
      progressiveDisclosure: true,
      enhancedHelp: false,
      basicFeaturesOnly: false,
      showAdvancedTips: true
    },
    thresholds: {
      sessionCount: 5,
      totalHours: 2,
      completedAnalyses: 10,
      avgAccuracy: 0.6
    }
  },
  ADVANCED: {
    id: 'advanced',
    name: '高级用户',
    description: '熟练使用所有功能',
    features: {
      guidedTours: false,
      simplifiedUI: false,
      progressiveDisclosure: false,
      enhancedHelp: false,
      basicFeaturesOnly: false,
      showAdvancedTips: false,
      powerUserFeatures: true,
      keyboardShortcuts: true
    },
    thresholds: {
      sessionCount: 20,
      totalHours: 10,
      completedAnalyses: 50,
      avgAccuracy: 0.8
    }
  },
  EXPERT: {
    id: 'expert',
    name: '专家用户',
    description: '深度使用，追求效率',
    features: {
      guidedTours: false,
      simplifiedUI: false,
      progressiveDisclosure: false,
      enhancedHelp: false,
      basicFeaturesOnly: false,
      showAdvancedTips: false,
      powerUserFeatures: true,
      keyboardShortcuts: true,
      customization: true,
      betaFeatures: true
    },
    thresholds: {
      sessionCount: 50,
      totalHours: 25,
      completedAnalyses: 100,
      avgAccuracy: 0.9
    }
  }
};

/**
 * Learning patterns recognition
 */
const LEARNING_PATTERNS = {
  VISUAL: {
    id: 'visual',
    name: '视觉学习者',
    adaptations: {
      highlightVisualElements: true,
      useIconsAndImages: true,
      colorCoding: true,
      visualProgressIndicators: true
    }
  },
  AUDITORY: {
    id: 'auditory',
    name: '听觉学习者',
    adaptations: {
      audioFeedback: true,
      verbalInstructions: true,
      pronunciationFocus: true,
      audioExamples: true
    }
  },
  KINESTHETIC: {
    id: 'kinesthetic',
    name: '动觉学习者',
    adaptations: {
      interactiveElements: true,
      handsOnPractice: true,
      gestureControls: true,
      immediateFeedback: true
    }
  },
  ANALYTICAL: {
    id: 'analytical',
    name: '分析学习者',
    adaptations: {
      detailedExplanations: true,
      dataVisualization: true,
      stepByStepBreakdown: true,
      comparativeAnalysis: true
    }
  }
};

/**
 * Content difficulty levels
 */
const DIFFICULTY_LEVELS = {
  EASY: {
    id: 'easy',
    name: '简单',
    adaptations: {
      slowerPace: true,
      moreRepetition: true,
      simplerVocabulary: true,
      longerProcessingTime: true,
      visualAids: true
    }
  },
  MEDIUM: {
    id: 'medium',
    name: '中等',
    adaptations: {
      moderatePace: true,
      balancedContent: true,
      someChallenge: true,
      mixedMedia: true
    }
  },
  HARD: {
    id: 'hard',
    name: '困难',
    adaptations: {
      fasterPace: true,
      complexContent: true,
      minimalGuidance: true,
      challengeFocused: true,
      selfDirected: true
    }
  }
};

/**
 * Adaptive UI configurations
 */
const UI_CONFIGURATIONS = {
  [EXPERIENCE_LEVELS.BEGINNER.id]: {
    layout: 'simplified',
    navigation: 'basic',
    density: 'spacious',
    animations: 'subtle',
    helpVisibility: 'high',
    featureDiscovery: 'guided'
  },
  [EXPERIENCE_LEVELS.INTERMEDIATE.id]: {
    layout: 'standard',
    navigation: 'enhanced',
    density: 'balanced',
    animations: 'moderate',
    helpVisibility: 'medium',
    featureDiscovery: 'contextual'
  },
  [EXPERIENCE_LEVELS.ADVANCED.id]: {
    layout: 'compact',
    navigation: 'efficient',
    density: 'dense',
    animations: 'minimal',
    helpVisibility: 'low',
    featureDiscovery: 'exploration'
  },
  [EXPERIENCE_LEVELS.EXPERT.id]: {
    layout: 'customizable',
    navigation: 'keyboard',
    density: 'ultraCompact',
    animations: 'none',
    helpVisibility: 'onDemand',
    featureDiscovery: 'none'
  }
};

/**
 * Main adaptive experience hook
 */
export const useAdaptiveExperience = () => {
  const { user } = useAuth();
  const { trackEvent, trackFeatureUsage } = useAnalytics();
  const { preferences, updatePreferences } = useUserPreferences();

  const [userProfile, setUserProfile] = useState(null);
  const [experienceLevel, setExperienceLevel] = useState(EXPERIENCE_LEVELS.BEGINNER);
  const [learningPattern, setLearningPattern] = useState(null);
  const [difficultyPreference, setDifficultyPreference] = useState(DIFFICULTY_LEVELS.MEDIUM);
  const [uiConfiguration, setUiConfiguration] = useState(UI_CONFIGURATIONS.beginner);
  const [adaptations, setAdaptations] = useState({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Calculate user experience level based on behavior
  const calculateExperienceLevel = useCallback((stats) => {
    const { sessionCount = 0, totalHours = 0, completedAnalyses = 0, avgAccuracy = 0 } = stats;

    // Start from expert and work backwards
    const levels = [EXPERIENCE_LEVELS.EXPERT, EXPERIENCE_LEVELS.ADVANCED, EXPERIENCE_LEVELS.INTERMEDIATE, EXPERIENCE_LEVELS.BEGINNER];

    for (const level of levels) {
      const { thresholds } = level;
      if (
        sessionCount >= thresholds.sessionCount &&
        totalHours >= thresholds.totalHours &&
        completedAnalyses >= thresholds.completedAnalyses &&
        avgAccuracy >= thresholds.avgAccuracy
      ) {
        return level;
      }
    }

    return EXPERIENCE_LEVELS.BEGINNER;
  }, []);

  // Detect learning patterns based on user behavior
  const detectLearningPattern = useCallback((behaviorData) => {
    const {
      visualInteractions = 0,
      audioUsage = 0,
      interactiveUsage = 0,
      analyticalFeatures = 0
    } = behaviorData;

    const total = visualInteractions + audioUsage + interactiveUsage + analyticalFeatures;
    if (total === 0) return LEARNING_PATTERNS.VISUAL; // Default to visual

    const scores = {
      visual: visualInteractions / total,
      auditory: audioUsage / total,
      kinesthetic: interactiveUsage / total,
      analytical: analyticalFeatures / total
    };

    // Find the dominant learning pattern
    const dominantPattern = Object.entries(scores).reduce((a, b) =>
      scores[a[0]] > scores[b[0]] ? a : b
    )[0];

    return LEARNING_PATTERNS[dominantPattern.toUpperCase()];
  }, []);

  // Adapt difficulty based on performance
  const adaptDifficulty = useCallback((performanceData) => {
    const {
      completionRate = 0,
      accuracy = 0,
      timeSpent = 0,
      frustrationSignals = 0
    } = performanceData;

    // Calculate difficulty score
    const difficultyScore = (completionRate * 0.3) + (accuracy * 0.4) + ((1 - frustrationSignals) * 0.3);

    if (difficultyScore < 0.3) {
      return DIFFICULTY_LEVELS.EASY;
    } else if (difficultyScore < 0.7) {
      return DIFFICULTY_LEVELS.MEDIUM;
    } else {
      return DIFFICULTY_LEVELS.HARD;
    }
  }, []);

  // Generate adaptations based on user profile
  const generateAdaptations = useCallback((profile) => {
    const adaptations = {};

    // Experience level adaptations
    Object.assign(adaptations, profile.experienceLevel.features);

    // Learning pattern adaptations
    if (profile.learningPattern) {
      Object.assign(adaptations, profile.learningPattern.adaptations);
    }

    // Difficulty adaptations
    Object.assign(adaptations, profile.difficultyPreference.adaptations);

    // User preference overrides
    if (profile.preferences?.accessibility) {
      Object.assign(adaptations, profile.preferences.accessibility);
    }

    // Performance-based adaptations
    if (profile.recentPerformance?.frustrationSignals > 0.5) {
      adaptations.simplifiedUI = true;
      adaptations.enhancedHelp = true;
    }

    return adaptations;
  }, []);

  // Update user profile with new data
  const updateUserProfile = useCallback((newData) => {
    setUserProfile(prev => {
      const updated = { ...prev, ...newData };

      // Recalculate derived properties
      if (newData.stats) {
        updated.experienceLevel = calculateExperienceLevel(newData.stats);
      }

      if (newData.behaviorData) {
        updated.learningPattern = detectLearningPattern(newData.behaviorData);
      }

      if (newData.performanceData) {
        updated.difficultyPreference = adaptDifficulty(newData.performanceData);
      }

      // Generate new adaptations
      updated.adaptations = generateAdaptations(updated);

      // Update UI configuration
      updated.uiConfiguration = UI_CONFIGURATIONS[updated.experienceLevel.id];

      return updated;
    });
  }, [calculateExperienceLevel, detectLearningPattern, adaptDifficulty, generateAdaptations]);

  // Track user interaction for pattern recognition
  const trackInteraction = useCallback((interactionType, context = {}) => {
    trackEvent('adaptive_interaction', {
      interaction_type: interactionType,
      context,
      experience_level: experienceLevel.id,
      timestamp: Date.now()
    });

    // Update behavior data for pattern detection
    if (userProfile) {
      const newBehaviorData = { ...userProfile.behaviorData };

      switch (interactionType) {
        case 'visual_focus':
          newBehaviorData.visualInteractions = (newBehaviorData.visualInteractions || 0) + 1;
          break;
        case 'audio_play':
          newBehaviorData.audioUsage = (newBehaviorData.audioUsage || 0) + 1;
          break;
        case 'interactive_element':
          newBehaviorData.interactiveUsage = (newBehaviorData.interactiveUsage || 0) + 1;
          break;
        case 'analytical_feature':
          newBehaviorData.analyticalFeatures = (newBehaviorData.analyticalFeatures || 0) + 1;
          break;
      }

      updateUserProfile({ behaviorData: newBehaviorData });
    }
  }, [trackEvent, experienceLevel, userProfile, updateUserProfile]);

  // Get personalized content recommendations
  const getContentRecommendations = useCallback((contentType = 'audio') => {
    if (!userProfile) return [];

    const recommendations = [];

    // Base recommendations on experience level
    switch (experienceLevel.id) {
      case 'beginner':
        recommendations.push({
          type: 'guided_tour',
          title: '新手引导',
          description: '了解基本功能',
          priority: 'high'
        });
        break;
      case 'intermediate':
        recommendations.push({
          type: 'skill_building',
          title: '技能提升',
          description: '进阶功能介绍',
          priority: 'medium'
        });
        break;
      case 'advanced':
        recommendations.push({
          type: 'efficiency_tips',
          title: '效率技巧',
          description: '高级使用技巧',
          priority: 'medium'
        });
        break;
      case 'expert':
        recommendations.push({
          type: 'customization',
          title: '个性化设置',
          description: '深度定制功能',
          priority: 'low'
        });
        break;
    }

    // Add learning pattern specific recommendations
    if (learningPattern) {
      switch (learningPattern.id) {
        case 'visual':
          recommendations.push({
            type: 'visual_content',
            title: '视觉学习材料',
            description: '图表和可视化内容',
            priority: 'medium'
          });
          break;
        case 'auditory':
          recommendations.push({
            type: 'audio_content',
            title: '听力练习',
            description: '音频和发音练习',
            priority: 'medium'
          });
          break;
        case 'kinesthetic':
          recommendations.push({
            type: 'interactive_content',
            title: '互动练习',
            description: '动手操作练习',
            priority: 'medium'
          });
          break;
        case 'analytical':
          recommendations.push({
            type: 'analytical_content',
            title: '深度分析',
            description: '详细分析工具',
            priority: 'medium'
          });
          break;
      }
    }

    return recommendations;
  }, [userProfile, experienceLevel, learningPattern]);

  // Get adaptive UI configuration
  const getAdaptiveUI = useCallback(() => {
    return {
      configuration: uiConfiguration,
      adaptations,
      experienceLevel: experienceLevel.id,
      learningPattern: learningPattern?.id,
      difficulty: difficultyPreference.id
    };
  }, [uiConfiguration, adaptations, experienceLevel, learningPattern, difficultyPreference]);

  // Should show feature discovery
  const shouldShowFeatureDiscovery = useCallback((featureId) => {
    if (!userProfile) return false;

    const { experienceLevel, preferences } = userProfile;
    const discoveredFeatures = preferences?.discoveredFeatures || [];

    // Don't show if already discovered
    if (discoveredFeatures.includes(featureId)) return false;

    // Show based on experience level
    switch (experienceLevel.id) {
      case 'beginner':
        return featureId.startsWith('basic_');
      case 'intermediate':
        return featureId.startsWith('basic_') || featureId.startsWith('intermediate_');
      case 'advanced':
      case 'expert':
        return true;
      default:
        return false;
    }
  }, [userProfile]);

  // Mark feature as discovered
  const markFeatureDiscovered = useCallback((featureId) => {
    if (!userProfile) return;

    const discoveredFeatures = [
      ...(userProfile.preferences?.discoveredFeatures || []),
      featureId
    ];

    updatePreferences({
      discoveredFeatures
    });

    trackFeatureUsage('feature_discovered', {
      feature_id: featureId,
      experience_level: experienceLevel.id
    });
  }, [userProfile, updatePreferences, trackFeatureUsage, experienceLevel]);

  // Get personalized help content
  const getPersonalizedHelp = useCallback((context) => {
    if (!userProfile) return null;

    const { experienceLevel, learningPattern } = userProfile;

    // Base help content on experience level and learning pattern
    const helpContent = {
      beginner: {
        visual: '点击这里查看详细说明和示例',
        auditory: '点击播放语音指导',
        kinesthetic: '尝试亲自操作，系统会给出即时反馈',
        analytical: '查看详细分析步骤和解释'
      },
      intermediate: {
        visual: '查看图表了解详细信息',
        auditory: '播放音频示例',
        kinesthetic: '动手实践巩固技能',
        analytical: '深入分析相关数据'
      },
      advanced: {
        visual: '快速预览相关图表',
        auditory: '选择性播放音频',
        kinesthetic: '直接进行操作',
        analytical: '查看关键分析指标'
      },
      expert: {
        visual: '图表概览',
        auditory: '音频控制',
        kinesthetic: '直接操作',
        analytical: '核心指标'
      }
    };

    return helpContent[experienceLevel.id][learningPattern?.id || 'visual'];
  }, [userProfile]);

  // Initialize user profile
  useEffect(() => {
    if (user) {
      setIsAnalyzing(true);

      // Simulate user profile analysis (in real app, this would come from backend)
      setTimeout(() => {
        const initialProfile = {
          userId: user.id,
          experienceLevel: EXPERIENCE_LEVELS.BEGINNER,
          learningPattern: LEARNING_PATTERNS.VISUAL,
          difficultyPreference: DIFFICULTY_LEVELS.MEDIUM,
          stats: {
            sessionCount: 0,
            totalHours: 0,
            completedAnalyses: 0,
            avgAccuracy: 0
          },
          behaviorData: {
            visualInteractions: 0,
            audioUsage: 0,
            interactiveUsage: 0,
            analyticalFeatures: 0
          },
          performanceData: {
            completionRate: 0,
            accuracy: 0,
            timeSpent: 0,
            frustrationSignals: 0
          },
          preferences: preferences
        };

        setUserProfile(initialProfile);
        setExperienceLevel(initialProfile.experienceLevel);
        setLearningPattern(initialProfile.learningPattern);
        setDifficultyPreference(initialProfile.difficultyPreference);
        setUiConfiguration(UI_CONFIGURATIONS[initialProfile.experienceLevel.id]);
        setAdaptations(generateAdaptations(initialProfile));
        setIsAnalyzing(false);

        trackFeatureUsage('adaptive_experience_initialized', {
          experience_level: initialProfile.experienceLevel.id,
          learning_pattern: initialProfile.learningPattern.id
        });
      }, 1000);
    }
  }, [user, preferences, generateAdaptations, trackFeatureUsage]);

  // Auto-update experience level when stats change
  useEffect(() => {
    if (userProfile && userProfile.stats) {
      const newExperienceLevel = calculateExperienceLevel(userProfile.stats);
      if (newExperienceLevel.id !== experienceLevel.id) {
        setExperienceLevel(newExperienceLevel);
        updateUserProfile({ experienceLevel: newExperienceLevel });

        trackFeatureUsage('experience_level_changed', {
          from: experienceLevel.id,
          to: newExperienceLevel.id
        });
      }
    }
  }, [userProfile, experienceLevel, calculateExperienceLevel, updateUserProfile, trackFeatureUsage]);

  return {
    // State
    userProfile,
    experienceLevel,
    learningPattern,
    difficultyPreference,
    uiConfiguration,
    adaptations,
    isAnalyzing,

    // Methods
    trackInteraction,
    getContentRecommendations,
    getAdaptiveUI,
    shouldShowFeatureDiscovery,
    markFeatureDiscovered,
    getPersonalizedHelp,
    updateUserProfile
  };
};

export default useAdaptiveExperience;