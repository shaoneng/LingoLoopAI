/**
 * User analytics and event tracking system
 * Provides comprehensive user behavior tracking and funnel analysis
 */

class AnalyticsManager {
  constructor() {
    this.events = [];
    this.userProperties = {};
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.isInitialized = false;
    this.queue = [];
    this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Only track browser events on client side
    if (typeof document !== 'undefined') {
      // Track page visibility
      this.trackVisibility();

      // Track online/offline status
      this.trackConnectivity();

      // Track before unload for session end
      this.trackSessionEnd();
    }
  }

  /**
   * Initialize analytics with user data
   */
  init(user = null) {
    if (this.isInitialized) return;

    this.userProperties = this.extractUserProperties(user);
    this.isInitialized = true;

    // Process queued events
    this.processQueue();

    // Only track browser events on client side
    if (typeof document !== 'undefined' && typeof window !== 'undefined') {
      // Track session start
      this.track('session_start', {
        session_id: this.sessionId,
        referrer: document.referrer,
        landing_page: window.location.pathname,
        user_agent: navigator.userAgent,
        screen_size: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
      });

      // Track page view
      this.trackPageView();
    }

    console.log('📊 Analytics initialized');
  }

  /**
   * Track custom event
   */
  track(eventName, properties = {}) {
    const event = {
      event: eventName,
      properties: {
        ...properties,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
      },
      userProperties: this.userProperties
    };

    // Add to events array
    this.events.push(event);

    // Send to analytics service
    this.sendEvent(event);

    // Also store locally for backup (client-side only)
    if (typeof localStorage !== 'undefined') {
      this.storeEvent(event);
    }

    console.log('📊 Event tracked:', eventName, properties);
  }

  /**
   * Track page view
   */
  trackPageView(path = null) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const pagePath = path || window.location.pathname;

    this.track('page_view', {
      page_path: pagePath,
      page_title: document.title,
      referrer: document.referrer,
      search_params: window.location.search,
      hash: window.location.hash
    });
  }

  /**
   * Track user interaction (clicks, form submissions, etc.)
   */
  trackInteraction(element, action, properties = {}) {
    const elementData = this.extractElementData(element);

    this.track('user_interaction', {
      action,
      ...elementData,
      ...properties
    });
  }

  /**
   * Track upload funnel events
   */
  trackUploadFunnel(step, properties = {}) {
    const funnelSteps = [
      'upload_opened',
      'file_selected',
      'upload_started',
      'upload_progress',
      'upload_completed',
      'transcription_started',
      'transcription_completed',
      'analysis_started',
      'analysis_completed'
    ];

    if (funnelSteps.includes(step)) {
      this.track(`upload_funnel_${step}`, {
        funnel_step: step,
        funnel_step_index: funnelSteps.indexOf(step),
        ...properties
      });
    }
  }

  /**
   * Track audio player interactions
   */
  trackPlayerAction(action, properties = {}) {
    const playerActions = [
      'play', 'pause', 'stop', 'seek', 'change_speed',
      'change_volume', 'loop', 'toggle_analysis', 'toggle_transcript'
    ];

    if (playerActions.includes(action)) {
      this.track('player_action', {
        player_action: action,
        ...properties
      });
    }
  }

  /**
   * Track error events
   */
  trackError(error, context = {}) {
    this.track('error_occurred', {
      error_type: error.name || 'Unknown',
      error_message: error.message || 'Unknown error',
      error_stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track feature usage
   */
  trackFeatureUsage(featureName, action = 'used', properties = {}) {
    this.track('feature_usage', {
      feature_name: featureName,
      feature_action: action,
      ...properties
    });
  }

  /**
   * Track user engagement metrics
   */
  trackEngagement(metrics = {}) {
    const sessionDuration = Date.now() - this.startTime;
    const scrollDepth = this.getScrollDepth();

    this.track('engagement_metrics', {
      session_duration: sessionDuration,
      scroll_depth: scrollDepth,
      mouse_movements: this.mouseMovements || 0,
      key_presses: this.keyPresses || 0,
      clicks: this.clicks || 0,
      ...metrics
    });
  }

  /**
   * Track conversion events
   */
  trackConversion(conversionType, properties = {}) {
    const conversionTypes = [
      'signup_completed',
      'login_completed',
      'upload_completed',
      'transcription_completed',
      'subscription_started',
      'feature_unlocked'
    ];

    if (conversionTypes.includes(conversionType)) {
      this.track('conversion', {
        conversion_type: conversionType,
        ...properties
      });
    }
  }

  /**
   * Set user properties for segmentation
   */
  setUserProperties(properties) {
    this.userProperties = {
      ...this.userProperties,
      ...properties
    };

    this.track('user_properties_updated', properties);
  }

  /**
   * Identify user with additional data
   */
  identify(userId, traits = {}) {
    this.userProperties = {
      ...this.userProperties,
      user_id: userId,
      ...traits
    };

    this.track('user_identified', {
      user_id: userId,
      traits
    });
  }

  /**
   * Track A/B test variations
   */
  trackExperiment(experimentName, variation, properties = {}) {
    this.track('experiment_viewed', {
      experiment_name: experimentName,
      variation: variation,
      ...properties
    });
  }

  /**
   * Get funnel analysis data
   */
  getFunnelAnalysis(funnelName, steps) {
    const funnelEvents = this.events.filter(event =>
      event.event.startsWith(`${funnelName}_`) ||
      event.properties.funnel_name === funnelName
    );

    const analysis = {
      funnel_name: funnelName,
      total_sessions: new Set(funnelEvents.map(e => e.properties.session_id)).size,
      steps: steps.map(step => {
        const stepEvents = funnelEvents.filter(e =>
          e.event === `${funnelName}_${step}` ||
          e.properties.funnel_step === step
        );

        return {
          step,
          count: stepEvents.length,
          unique_users: new Set(stepEvents.map(e => e.properties.user_id)).size,
          conversion_rate: stepEvents.length / funnelEvents.length * 100
        };
      })
    };

    return analysis;
  }

  /**
   * Get user retention data
   */
  getRetentionData(days = 7) {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const userSessions = this.events
      .filter(event => event.event === 'session_start')
      .map(event => ({
        user_id: event.properties.user_id,
        session_id: event.properties.session_id,
        timestamp: new Date(event.properties.timestamp)
      }))
      .filter(session => session.timestamp >= startDate);

    const retentionData = {
      period: `${days} days`,
      total_users: new Set(userSessions.map(s => s.user_id)).size,
      returning_users: new Set(
        userSessions
          .filter(s => userSessions.filter(other =>
            other.user_id === s.user_id && other.session_id !== s.session_id
          ).length > 0)
          .map(s => s.user_id)
      ).size,
      retention_rate: 0
    };

    retentionData.retention_rate =
      retentionData.total_users > 0 ?
      (retentionData.returning_users / retentionData.total_users * 100).toFixed(2) : 0;

    return retentionData;
  }

  /**
   * Export analytics data
   */
  exportData(format = 'json') {
    const data = {
      events: this.events,
      user_properties: this.userProperties,
      session_info: {
        session_id: this.sessionId,
        start_time: this.startTime,
        duration: Date.now() - this.startTime
      },
      export_timestamp: new Date().toISOString()
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    return data;
  }

  // Private methods

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  extractUserProperties(user) {
    if (!user) return {};

    return {
      user_id: user.id,
      email: user.email,
      display_name: user.displayName,
      created_at: user.createdAt,
      plan_type: user.plan || 'free',
      is_premium: !!user.subscription,
      stats: user.stats || {}
    };
  }

  extractElementData(element) {
    return {
      element_tag: element.tagName?.toLowerCase(),
      element_id: element.id || null,
      element_class: element.className || null,
      element_text: element.textContent?.substring(0, 100) || null,
      element_aria_label: element.getAttribute('aria-label') || null
    };
  }

  getScrollDepth() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return 0;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    return scrollHeight > 0 ? Math.round((scrollTop / scrollHeight) * 100) : 0;
  }

  trackVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden');
      } else {
        this.track('page_visible');
      }
    });
  }

  trackConnectivity() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.track('connection_restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.track('connection_lost');
    });
  }

  trackSessionEnd() {
    window.addEventListener('beforeunload', () => {
      this.track('session_end', {
        session_duration: Date.now() - this.startTime
      });
    });
  }

  sendEvent(event) {
    // In a real implementation, this would send to your analytics service
    // For now, we'll store locally and prepare for future integration

    if (this.isOnline && this.isInitialized) {
      // Send to analytics service (placeholder for future integration)
      this.sendToAnalyticsService(event);
    }
  }

  sendToAnalyticsService(event) {
    // Placeholder for future analytics service integration
    // This could be Google Analytics, Amplitude, PostHog, Mixpanel, etc.

    // Example implementation for Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', event.event, event.properties);
    }

    // Example implementation for Mixpanel
    if (typeof mixpanel !== 'undefined') {
      mixpanel.track(event.event, event.properties);
    }

    // Example implementation for PostHog
    if (typeof posthog !== 'undefined') {
      posthog.capture(event.event, event.properties);
    }
  }

  storeEvent(event) {
    if (typeof localStorage === 'undefined') return;

    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      storedEvents.push(event);

      // Keep only last 1000 events to prevent storage bloat
      if (storedEvents.length > 1000) {
        storedEvents.splice(0, storedEvents.length - 1000);
      }

      localStorage.setItem('analytics_events', JSON.stringify(storedEvents));
    } catch (error) {
      console.warn('Failed to store analytics event:', error);
    }
  }

  processQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      this.track(event.eventName, event.properties);
    }
  }

  // Auto-tracking setup
  setupAutoTracking() {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    this.setupClickTracking();
    this.setupFormTracking();
    this.setupPlayerTracking();
    this.setupErrorTracking();
  }

  setupClickTracking() {
    if (typeof document === 'undefined') return;

    document.addEventListener('click', (event) => {
      const element = event.target.closest('button, a, [onclick], [data-track]');
      if (element) {
        this.trackInteraction(element, 'click', {
          mouse_x: event.clientX,
          mouse_y: event.clientY
        });
        this.clicks = (this.clicks || 0) + 1;
      }
    });
  }

  setupFormTracking() {
    if (typeof document === 'undefined') return;

    document.addEventListener('submit', (event) => {
      const form = event.target;
      this.trackInteraction(form, 'form_submit', {
        form_id: form.id,
        form_action: form.action
      });
    });
  }

  setupPlayerTracking() {
    if (typeof document === 'undefined') return;

    // This will be implemented when we have audio player elements
    document.addEventListener('player-action', (event) => {
      this.trackPlayerAction(event.detail.action, event.detail.properties);
    });
  }

  setupErrorTracking() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection'
      });
    });
  }
}

// Create singleton instance
const analyticsManager = new AnalyticsManager();

// Export instance
export default analyticsManager;

// Convenience exports for specific tracking
export const track = (eventName, properties) => analyticsManager.track(eventName, properties);
export const trackPageView = (path) => analyticsManager.trackPageView(path);
export const trackUploadFunnel = (step, properties) => analyticsManager.trackUploadFunnel(step, properties);
export const trackPlayerAction = (action, properties) => analyticsManager.trackPlayerAction(action, properties);
export const trackError = (error, context) => analyticsManager.trackError(error, context);
export const trackFeatureUsage = (feature, action, properties) => analyticsManager.trackFeatureUsage(feature, action, properties);
export const trackConversion = (type, properties) => analyticsManager.trackConversion(type, properties);
export const setUserProperties = (properties) => analyticsManager.setUserProperties(properties);
export const identify = (userId, traits) => analyticsManager.identify(userId, traits);
export const trackExperiment = (name, variation, properties) => analyticsManager.trackExperiment(name, variation, properties);