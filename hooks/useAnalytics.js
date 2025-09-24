import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import analyticsManager, {
  track,
  trackPageView,
  trackUploadFunnel,
  trackPlayerAction,
  trackError,
  trackFeatureUsage,
  trackConversion,
  setUserProperties,
  identify
} from '../utils/analytics';

/**
 * React hook for analytics tracking
 * Provides easy-to-use tracking functions for React components
 */
export const useAnalytics = () => {
  const { user } = useAuth();
  const previousUserRef = useRef(null);
  const initializedRef = useRef(false);

  // Initialize analytics when user is available
  useEffect(() => {
    if (user && !initializedRef.current) {
      analyticsManager.init(user);
      initializedRef.current = true;

      // Identify user with their ID and traits
      identify(user.id, {
        email: user.email,
        display_name: user.displayName,
        plan: user.plan || 'free',
        created_at: user.createdAt,
        is_premium: !!user.subscription
      });
    }

    // Handle user changes
    if (user !== previousUserRef.current) {
      if (user) {
        // User logged in
        trackConversion('login_completed', {
          user_id: user.id,
          email: user.email
        });
      } else if (previousUserRef.current) {
        // User logged out
        track('user_logged_out');
      }

      previousUserRef.current = user;
    }
  }, [user]);

  // Track page views
  useEffect(() => {
    const handleRouteChange = () => {
      trackPageView();
    };

    // Track initial page view
    if (initializedRef.current) {
      trackPageView();
    }

    // Listen for route changes (for Single Page Applications)
    window.addEventListener('popstate', handleRouteChange);

    // Custom event for programmatic navigation
    window.addEventListener('routechange', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('routechange', handleRouteChange);
    };
  }, [initializedRef.current]);

  // Track user engagement
  useEffect(() => {
    const engagementInterval = setInterval(() => {
      if (initializedRef.current) {
        analyticsManager.trackEngagement();
      }
    }, 30000); // Track engagement every 30 seconds

    return () => {
      clearInterval(engagementInterval);
    };
  }, [initializedRef.current]);

  // Core tracking functions
  const trackEvent = useCallback((eventName, properties = {}) => {
    track(eventName, properties);
  }, []);

  const trackUploadStep = useCallback((step, properties = {}) => {
    trackUploadFunnel(step, properties);
  }, []);

  const trackPlayerEvent = useCallback((action, properties = {}) => {
    trackPlayerAction(action, properties);
  }, []);

  const trackErrorEvent = useCallback((error, context = {}) => {
    trackError(error, context);
  }, []);

  const trackFeature = useCallback((featureName, action = 'used', properties = {}) => {
    trackFeatureUsage(featureName, action, properties);
  }, []);

  const trackFeatureUsage = useCallback((featureName, properties = {}) => {
    track('feature_usage', {
      feature_name: featureName,
      ...properties
    });
  }, []);

  const trackConversionEvent = useCallback((conversionType, properties = {}) => {
    trackConversion(conversionType, properties);
  }, []);

  const updateUserProperties = useCallback((properties) => {
    setUserProperties(properties);
  }, []);

  // A/B testing helpers
  const trackExperiment = useCallback((experimentName, variation, properties = {}) => {
    analyticsManager.trackExperiment(experimentName, variation, properties);
  }, []);

  // Component-specific tracking helpers
  const trackButtonClick = useCallback((buttonName, properties = {}) => {
    track('button_clicked', {
      button_name: buttonName,
      ...properties
    });
  }, []);

  const trackModalOpen = useCallback((modalName, properties = {}) => {
    track('modal_opened', {
      modal_name: modalName,
      ...properties
    });
  }, []);

  const trackModalClose = useCallback((modalName, properties = {}) => {
    track('modal_closed', {
      modal_name: modalName,
      ...properties
    });
  }, []);

  const trackFormSubmit = useCallback((formName, properties = {}) => {
    track('form_submitted', {
      form_name: formName,
      ...properties
    });
  }, []);

  const trackFileUpload = useCallback((fileName, fileSize, fileType, properties = {}) => {
    track('file_upload_started', {
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      ...properties
    });
  }, []);

  const trackSearch = useCallback((searchQuery, resultsCount, properties = {}) => {
    track('search_performed', {
      search_query: searchQuery,
      results_count: resultsCount,
      ...properties
    });
  }, []);

  // Performance tracking
  const trackPerformance = useCallback((metricName, value, properties = {}) => {
    track('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      ...properties
    });
  }, []);

  // Error tracking wrapper
  const withErrorTracking = useCallback(async (fn, context = {}) => {
    try {
      return await fn();
    } catch (error) {
      trackErrorEvent(error, context);
      throw error;
    }
  }, [trackErrorEvent]);

  // Time tracking wrapper
  const trackTime = useCallback(async (metricName, fn) => {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      trackPerformance(metricName, duration, {
        unit: 'milliseconds',
        success: true
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      trackPerformance(metricName, duration, {
        unit: 'milliseconds',
        success: false,
        error: error.message
      });

      throw error;
    }
  }, [trackPerformance]);

  // Auto-track component mount/unmount
  const useComponentTracking = useCallback((componentName, properties = {}) => {
    useEffect(() => {
      track('component_mounted', {
        component_name: componentName,
        ...properties
      });

      return () => {
        track('component_unmounted', {
          component_name: componentName,
          ...properties
        });
      };
    }, [componentName, JSON.stringify(properties)]);
  }, []);

  // Track feature discovery (when user uses a feature for the first time)
  const trackFeatureDiscovery = useCallback((featureName, properties = {}) => {
    track('feature_discovered', {
      feature_name: featureName,
      is_first_use: true,
      ...properties
    });
  }, []);

  // Track user progress through onboarding or tutorials
  const trackOnboardingProgress = useCallback((stepName, stepNumber, totalSteps, properties = {}) => {
    track('onboarding_progress', {
      step_name: stepName,
      step_number: stepNumber,
      total_steps: totalSteps,
      completion_percentage: (stepNumber / totalSteps) * 100,
      ...properties
    });
  }, []);

  // Track user satisfaction or feedback
  const trackUserFeedback = useCallback((feedbackType, rating, comment = '', properties = {}) => {
    track('user_feedback', {
      feedback_type: feedbackType,
      rating,
      comment,
      ...properties
    });
  }, []);

  // Export analytics data for debugging
  const exportAnalyticsData = useCallback((format = 'json') => {
    return analyticsManager.exportData(format);
  }, []);

  return {
    // Core tracking
    trackEvent,
    trackUploadStep,
    trackPlayerEvent,
    trackErrorEvent,
    trackFeature,
    trackFeatureUsage,
    trackConversionEvent,
    updateUserProperties,

    // A/B testing
    trackExperiment,

    // Component helpers
    trackButtonClick,
    trackModalOpen,
    trackModalClose,
    trackFormSubmit,
    trackFileUpload,
    trackSearch,

    // Performance
    trackPerformance,

    // Error handling
    withErrorTracking,
    trackTime,

    // Component lifecycle
    useComponentTracking,

    // Feature discovery
    trackFeatureDiscovery,

    // Onboarding
    trackOnboardingProgress,

    // User feedback
    trackUserFeedback,

    // Data export
    exportAnalyticsData,

    // Analytics manager access (for advanced usage)
    analytics: analyticsManager,

    // User info
    user,
    sessionId: analyticsManager.sessionId,
    isInitialized: initializedRef.current
  };
};

export default useAnalytics;