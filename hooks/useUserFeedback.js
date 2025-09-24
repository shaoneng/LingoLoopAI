/**
 * User Feedback Hook
 * Manages feedback collection, analytics, and user interactions
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FEEDBACK_TYPES,
  FEEDBACK_CATEGORIES,
  FEEDBACK_PRIORITIES,
  COLLECTION_METHODS,
  SURVEY_TEMPLATES,
  ANALYTICS_EVENTS,
  getAnalyticsSession,
  createFeedbackObject,
  validateFeedback,
  analyzeFeedback
} from '../utils/userFeedback';

export const useUserFeedback = (userId) => {
  const [feedbackQueue, setFeedbackQueue] = useState([]);
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showSurvey, setShowSurvey] = useState(null);
  const [feedbackPreferences, setFeedbackPreferences] = useState({
    enableAnalytics: true,
    enableFeedbackCollection: true,
    surveyFrequency: 'medium',
    lastSurveyDate: null,
    feedbackScore: 5
  });

  const analyticsSession = useRef(getAnalyticsSession());
  const feedbackTimeouts = useRef({});

  // Initialize feedback system
  useEffect(() => {
    loadFeedbackPreferences();
    loadFeedbackHistory();
    setupAutomaticTriggers();
    initializeSessionTracking();

    return () => {
      clearAllTimeouts();
    };
  }, [userId]);

  const loadFeedbackPreferences = useCallback(() => {
    const stored = localStorage.getItem(`lingoloop.feedback.preferences.${userId}`);
    if (stored) {
      setFeedbackPreferences(JSON.parse(stored));
    }
  }, [userId]);

  const saveFeedbackPreferences = useCallback((preferences) => {
    const newPreferences = { ...feedbackPreferences, ...preferences };
    setFeedbackPreferences(newPreferences);
    localStorage.setItem(`lingoloop.feedback.preferences.${userId}`, JSON.stringify(newPreferences));
  }, [feedbackPreferences, userId]);

  const loadFeedbackHistory = useCallback(() => {
    const stored = localStorage.getItem(`lingoloop.feedback.history.${userId}`);
    if (stored) {
      setFeedbackHistory(JSON.parse(stored));
    }
  }, [userId]);

  const saveFeedbackToHistory = useCallback((feedback) => {
    const history = [...feedbackHistory, feedback];
    setFeedbackHistory(history);
    localStorage.setItem(`lingoloop.feedback.history.${userId}`, JSON.stringify(history));
  }, [feedbackHistory, userId]);

  const initializeSessionTracking = useCallback(() => {
    analyticsSession.current.trackPageView(window.location.href, document.title);

    // Listen for custom events
    window.addEventListener('triggerFeedback', handleFeedbackTrigger);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Track page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const setupAutomaticTriggers = useCallback(() => {
    // Session end trigger
    setupSessionEndTrigger();

    // Feature usage triggers
    setupFeatureUsageTriggers();

    // Performance triggers
    setupPerformanceTriggers();

    // Error triggers
    setupErrorTriggers();
  }, []);

  const setupSessionEndTrigger = useCallback(() => {
    let sessionStartTime = Date.now();
    let isActive = true;

    const checkSessionEnd = () => {
      if (!isActive) return;

      const sessionDuration = Date.now() - sessionStartTime;

      // Trigger feedback after 30 minutes of active use
      if (sessionDuration > 30 * 60 * 1000) {
        triggerFeedbackSurvey('session-end', { sessionDuration });
        isActive = false;
        return;
      }

      // Check again in 5 minutes
      feedbackTimeouts.current.sessionEnd = setTimeout(checkSessionEnd, 5 * 60 * 1000);
    };

    // Start checking
    feedbackTimeouts.current.sessionEnd = setTimeout(checkSessionEnd, 5 * 60 * 1000);

    // Reset on user activity
    const resetTimer = () => {
      sessionStartTime = Date.now();
      isActive = true;
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
  }, []);

  const setupFeatureUsageTriggers = useCallback(() => {
    // This will be called when features are used
    window.addEventListener('featureUsed', (event) => {
      const { featureId, action, metadata } = event.detail;
      analyticsSession.current.trackFeatureUsage(featureId, action, metadata);

      // Track feature usage for feedback triggers
      const featureUsage = parseInt(localStorage.getItem(`lingoloop.feature.usage.${featureId}.${userId}`) || '0');
      const newUsage = featureUsage + 1;
      localStorage.setItem(`lingoloop.feature.usage.${featureId}.${userId}`, newUsage.toString());

      // Trigger feedback after 5 uses of a feature
      if (newUsage === 5) {
        triggerFeedbackSurvey('feature-usage', { featureId, useCount: newUsage });
      }
    });
  }, [userId]);

  const setupPerformanceTriggers = useCallback(() => {
    // Track page load performance
    if (window.performance) {
      window.addEventListener('load', () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
          const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
          analyticsSession.current.trackPerformance('page_load', loadTime);

          // Trigger feedback for slow loads
          if (loadTime > 5000) {
            triggerFeedbackSurvey('performance', { metric: 'page_load', value: loadTime, threshold: 5000 });
          }
        }
      });
    }
  }, []);

  const setupErrorTriggers = useCallback(() => {
    window.addEventListener('error', (event) => {
      analyticsSession.current.trackError('javascript', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });

      // Trigger feedback for critical errors
      triggerFeedbackSurvey('error', { errorType: 'javascript', errorMessage: event.message });
    });

    window.addEventListener('unhandledrejection', (event) => {
      analyticsSession.current.trackError('promise', event.reason);
      triggerFeedbackSurvey('error', { errorType: 'promise', errorMessage: event.reason });
    });
  }, []);

  const handleFeedbackTrigger = useCallback((event) => {
    const { trigger, data } = event.detail;
    triggerFeedbackSurvey(trigger, data);
  }, []);

  const handleBeforeUnload = useCallback(() => {
    analyticsSession.current.endSession();
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      analyticsSession.current.trackEvent('page_focus');
    } else {
      analyticsSession.current.trackEvent('page_blur');
    }
  }, []);

  const clearAllTimeouts = useCallback(() => {
    Object.values(feedbackTimeouts.current).forEach(timeout => {
      clearTimeout(timeout);
    });
    feedbackTimeouts.current = {};
  }, []);

  // Feedback submission
  const submitFeedback = useCallback(async (feedbackData) => {
    if (!feedbackPreferences.enableFeedbackCollection) {
      return { success: false, message: 'Feedback collection is disabled' };
    }

    const validation = validateFeedback(feedbackData);
    if (!validation.isValid) {
      return { success: false, message: 'Validation failed', errors: validation.errors };
    }

    setIsSubmitting(true);

    try {
      // Analyze feedback
      const analysis = analyzeFeedback(feedbackData);

      // Create feedback object
      const feedback = createFeedbackObject({
        ...feedbackData,
        userId,
        sessionId: analyticsSession.current.sessionId,
        analysis
      });

      // Add to queue
      setFeedbackQueue(prev => [...prev, feedback]);

      // Track feedback submission
      analyticsSession.current.trackEvent(ANALYTICS_EVENTS.FEEDBACK_SUBMITTED, {
        feedbackType: feedback.type,
        feedbackCategory: feedback.category,
        sentiment: analysis.sentiment,
        urgency: analysis.urgency
      });

      // Save to history
      saveFeedbackToHistory(feedback);

      // Process feedback (in real app, this would send to backend)
      await processFeedback(feedback);

      setIsSubmitting(false);
      setShowFeedbackModal(false);

      return { success: true, message: 'Feedback submitted successfully', feedback };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setIsSubmitting(false);
      return { success: false, message: 'Failed to submit feedback' };
    }
  }, [userId, feedbackPreferences, saveFeedbackToHistory]);

  const processFeedback = useCallback(async (feedback) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Remove from queue
    setFeedbackQueue(prev => prev.filter(f => f.id !== feedback.id));

    // Update preferences based on feedback
    if (feedback.type === FEEDBACK_TYPES.RATING) {
      saveFeedbackPreferences({
        feedbackScore: feedback.rating,
        lastFeedbackDate: new Date().toISOString()
      });
    }

    console.log('Feedback processed:', feedback);
  }, [saveFeedbackPreferences]);

  // Survey management
  const triggerFeedbackSurvey = useCallback((trigger, data = {}) => {
    if (!feedbackPreferences.enableFeedbackCollection) return;

    const lastSurvey = feedbackPreferences.lastSurveyDate;
    const surveyFrequency = feedbackPreferences.surveyFrequency;

    // Check if enough time has passed since last survey
    if (lastSurvey) {
      const lastDate = new Date(lastSurvey);
      const now = new Date();
      const daysSinceLastSurvey = (now - lastDate) / (1000 * 60 * 60 * 24);

      const minDaysBetweenSurveys = {
        low: 30,
        medium: 14,
        high: 7
      };

      if (daysSinceLastSurvey < minDaysBetweenSurveys[surveyFrequency]) {
        return;
      }
    }

    // Select appropriate survey based on trigger
    const survey = selectSurveyForTrigger(trigger, data);
    if (survey) {
      setShowSurvey(survey);
      setActiveSurveys(prev => [...prev, survey.id]);

      // Track survey start
      analyticsSession.current.trackEvent(ANALYTICS_EVENTS.SURVEY_STARTED, {
        surveyId: survey.id,
        trigger
      });
    }
  }, [feedbackPreferences]);

  const selectSurveyForTrigger = useCallback((trigger, data) => {
    switch (trigger) {
      case 'session-end':
        return SURVEY_TEMPLATES.GENERAL_SATISFACTION;

      case 'feature-usage':
        return SURVEY_TEMPLATES.FEATURE_SPECIFIC;

      case 'performance':
        return SURVEY_TEMPLATES.PERFORMANCE_FEEDBACK;

      case 'error':
        return {
          ...SURVEY_TEMPLATES.GENERAL_SATISFACTION,
          id: 'error-feedback',
          name: 'Error Experience Survey',
          description: 'Help us understand what went wrong'
        };

      case 'onboarding':
        return SURVEY_TEMPLATES.ONBOARDING_FEEDBACK;

      default:
        return SURVEY_TEMPLATES.GENERAL_SATISFACTION;
    }
  }, []);

  const submitSurvey = useCallback(async (surveyId, responses) => {
    try {
      setIsSubmitting(true);

      // Create feedback from survey responses
      const feedback = createFeedbackObject({
        type: FEEDBACK_TYPES.GENERAL_FEEDBACK,
        category: FEEDBACK_CATEGORIES.UI_UX,
        title: `Survey Response: ${surveyId}`,
        message: formatSurveyResponses(responses),
        metadata: {
          surveyId,
          responses,
          trigger: showSurvey?.trigger || 'manual'
        }
      });

      // Process survey feedback
      await processFeedback(feedback);

      // Track survey completion
      analyticsSession.current.trackEvent(ANALYTICS_EVENTS.SURVEY_COMPLETED, {
        surveyId,
        responseCount: Object.keys(responses).length,
        completionTime: Date.now()
      });

      // Update preferences
      saveFeedbackPreferences({
        lastSurveyDate: new Date().toISOString()
      });

      // Remove from active surveys
      setActiveSurveys(prev => prev.filter(id => id !== surveyId));
      setShowSurvey(null);
      setIsSubmitting(false);

      return { success: true, message: 'Survey submitted successfully' };
    } catch (error) {
      console.error('Error submitting survey:', error);
      setIsSubmitting(false);
      return { success: false, message: 'Failed to submit survey' };
    }
  }, [processFeedback, saveFeedbackPreferences, showSurvey]);

  const formatSurveyResponses = useCallback((responses) => {
    return Object.entries(responses)
      .map(([questionId, response]) => {
        if (typeof response === 'object') {
          return `${questionId}: ${JSON.stringify(response)}`;
        }
        return `${questionId}: ${response}`;
      })
      .join('\n');
  }, []);

  const cancelSurvey = useCallback(() => {
    if (showSurvey) {
      // Track survey abandonment
      analyticsSession.current.trackEvent(ANALYTICS_EVENTS.SURVEY_ABANDONED, {
        surveyId: showSurvey.id
      });

      setActiveSurveys(prev => prev.filter(id => id !== showSurvey.id));
      setShowSurvey(null);
    }
  }, [showSurvey]);

  // Analytics tracking
  const trackEvent = useCallback((eventType, eventData = {}) => {
    if (!feedbackPreferences.enableAnalytics) return;

    analyticsSession.current.trackEvent(eventType, eventData);
  }, [feedbackPreferences]);

  const trackFeatureUsage = useCallback((featureId, action, metadata = {}) => {
    if (!feedbackPreferences.enableAnalytics) return;

    analyticsSession.current.trackFeatureUsage(featureId, action, metadata);

    // Dispatch custom event for feature usage tracking
    window.dispatchEvent(new CustomEvent('featureUsed', {
      detail: { featureId, action, metadata }
    }));
  }, [feedbackPreferences]);

  const trackError = useCallback((errorType, errorMessage, errorDetails = {}) => {
    if (!feedbackPreferences.enableAnalytics) return;

    analyticsSession.current.trackError(errorType, errorMessage, errorDetails);
  }, [feedbackPreferences]);

  const trackPerformance = useCallback((metricName, value, unit = 'ms') => {
    if (!feedbackPreferences.enableAnalytics) return;

    analyticsSession.current.trackPerformance(metricName, value, unit);
  }, [feedbackPreferences]);

  // UI controls
  const openFeedbackModal = useCallback((initialData = {}) => {
    setShowFeedbackModal(true);
  }, []);

  const closeFeedbackModal = useCallback(() => {
    setShowFeedbackModal(false);
  }, []);

  const updateFeedbackPreferences = useCallback((newPreferences) => {
    saveFeedbackPreferences(newPreferences);
  }, [saveFeedbackPreferences]);

  const getFeedbackStats = useCallback(() => {
    return {
      totalSubmitted: feedbackHistory.length,
      pendingInQueue: feedbackQueue.length,
      activeSurveys: activeSurveys.length,
      averageRating: calculateAverageRating(),
      lastSubmission: feedbackHistory.length > 0 ? feedbackHistory[feedbackHistory.length - 1].createdAt : null,
      preferences: feedbackPreferences
    };
  }, [feedbackHistory, feedbackQueue, activeSurveys, feedbackPreferences]);

  const calculateAverageRating = useCallback(() => {
    const ratings = feedbackHistory
      .filter(f => f.type === FEEDBACK_TYPES.RATING && f.rating)
      .map(f => f.rating);

    if (ratings.length === 0) return 0;

    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }, [feedbackHistory]);

  const getSessionData = useCallback(() => {
    return analyticsSession.current.getSessionSummary();
  }, []);

  return {
    // State
    feedbackQueue,
    activeSurveys,
    feedbackHistory,
    isSubmitting,
    showFeedbackModal,
    showSurvey,
    feedbackPreferences,

    // Actions
    submitFeedback,
    submitSurvey,
    cancelSurvey,
    openFeedbackModal,
    closeFeedbackModal,
    updateFeedbackPreferences,
    trackEvent,
    trackFeatureUsage,
    trackError,
    trackPerformance,

    // Queries
    getFeedbackStats,
    getSessionData,

    // Modals
    showFeedbackModal,
    setShowFeedbackModal,
    showSurvey,
    setShowSurvey
  };
};

// Helper function to format survey responses
const formatSurveyResponses = (responses) => {
  return Object.entries(responses)
    .map(([questionId, response]) => {
      if (typeof response === 'object') {
        return `${questionId}: ${JSON.stringify(response)}`;
      }
      return `${questionId}: ${response}`;
    })
    .join('\n');
};