/**
 * User Feedback and Analytics Collection System
 * Collects, analyzes, and acts on user feedback and behavior data
 */

// Feedback types and categories
export const FEEDBACK_TYPES = {
  BUG_REPORT: 'bug-report',
  FEATURE_REQUEST: 'feature-request',
  USABILITY_ISSUE: 'usability-issue',
  PERFORMANCE_ISSUE: 'performance-issue',
  CONTENT_FEEDBACK: 'content-feedback',
  GENERAL_FEEDBACK: 'general-feedback',
  RATING: 'rating',
  SUGGESTION: 'suggestion',
  ERROR_REPORT: 'error-report'
};

export const FEEDBACK_CATEGORIES = {
  AUDIO_UPLOAD: 'audio-upload',
  TRANSCRIPTION: 'transcription',
  ANALYSIS: 'analysis',
  PLAYBACK: 'playback',
  UI_UX: 'ui-ux',
  PERFORMANCE: 'performance',
  CONTENT: 'content',
  ACCOUNT: 'account',
  BILLING: 'billing',
  MOBILE: 'mobile',
  DESKTOP: 'desktop',
  OTHER: 'other'
};

export const FEEDBACK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const FEEDBACK_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  REVIEWING: 'reviewing',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  DUPLICATE: 'duplicate'
};

// Feedback collection triggers
export const FEEDBACK_TRIGGERS = {
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  SESSION_END: 'session-end',
  ERROR_OCCURRED: 'error-occurred',
  FEATURE_USAGE: 'feature-usage',
  PERFORMANCE_DROP: 'performance-drop',
  ABANDONMENT: 'abandonment',
  RATING_PROMPT: 'rating-prompt'
};

// User satisfaction metrics
export const SATISFACTION_METRICS = {
  CSAT: 'csat', // Customer Satisfaction Score
  NPS: 'nps', // Net Promoter Score
  CES: 'ces', // Customer Effort Score
  USABILITY: 'usability',
  PERFORMANCE: 'performance',
  FEATURE_SATISFACTION: 'feature-satisfaction'
};

// Analytics events
export const ANALYTICS_EVENTS = {
  // User actions
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  USER_REGISTER: 'user_register',
  PAGE_VIEW: 'page_view',
  FEATURE_USE: 'feature_use',
  BUTTON_CLICK: 'button_click',
  FORM_SUBMIT: 'form_submit',
  SEARCH: 'search',
  FILTER: 'filter',
  SORT: 'sort',

  // Audio/transcription events
  AUDIO_UPLOAD_START: 'audio_upload_start',
  AUDIO_UPLOAD_COMPLETE: 'audio_upload_complete',
  AUDIO_UPLOAD_FAIL: 'audio_upload_fail',
  TRANSCRIPTION_START: 'transcription_start',
  TRANSCRIPTION_COMPLETE: 'transcription_complete',
  TRANSCRIPTION_FAIL: 'transcription_fail',
  ANALYSIS_START: 'analysis_start',
  ANALYSIS_COMPLETE: 'analysis_complete',
  ANALYSIS_FAIL: 'analysis_fail',
  PLAYBACK_START: 'playback_start',
  PLAYBACK_PAUSE: 'playback_pause',
  PLAYBACK_STOP: 'playback_stop',
  PLAYBACK_COMPLETE: 'playback_complete',

  // UI/UX events
  MODAL_OPEN: 'modal_open',
  MODAL_CLOSE: 'modal_close',
  TAB_SWITCH: 'tab_switch',
  MENU_OPEN: 'menu_open',
  MENU_CLOSE: 'menu_close',
  SCROLL: 'scroll',
  RESIZE: 'resize',

  // Error events
  ERROR_OCCURRED: 'error_occurred',
  ERROR_HANDLED: 'error_handled',
  NETWORK_ERROR: 'network_error',
  API_ERROR: 'api_error',
  CLIENT_ERROR: 'client_error',

  // Performance events
  PAGE_LOAD: 'page_load',
  COMPONENT_RENDER: 'component_render',
  API_CALL: 'api_call',
  CACHE_HIT: 'cache_hit',
  CACHE_MISS: 'cache_miss',

  // Feedback events
  FEEDBACK_SUBMITTED: 'feedback_submitted',
  RATING_SUBMITTED: 'rating_submitted',
  SURVEY_STARTED: 'survey_started',
  SURVEY_COMPLETED: 'survey_completed',
  SURVEY_ABANDONED: 'survey_abandoned',

  // Business events
  SUBSCRIPTION_START: 'subscription_start',
  SUBSCRIPTION_CANCEL: 'subscription_cancel',
  UPGRADE_ATTEMPT: 'upgrade_attempt',
  DOWNGRADE_ATTEMPT: 'downgrade_attempt',
  REFUND_REQUEST: 'refund_request'
};

// User journey tracking
export const USER_JOURNEY_STAGES = {
  AWARENESS: 'awareness',
  ACQUISITION: 'acquisition',
  ONBOARDING: 'onboarding',
  ACTIVATION: 'activation',
  ENGAGEMENT: 'engagement',
  RETENTION: 'retention',
  REVENUE: 'revenue',
  ADVOCACY: 'advocacy'
};

// Feedback collection methods
export const COLLECTION_METHODS = {
  IN_APP_SURVEY: 'in-app-survey',
  EMAIL_SURVEY: 'email-survey',
  POPUP_MODAL: 'popup-modal',
  SIDEBAR_WIDGET: 'sidebar-widget',
  BOTTOM_BANNER: 'bottom-banner',
  CONTEXTUAL_TOOLTIP: 'contextual-tooltip',
  EXIT_INTENT: 'exit-intent',
  SESSION_END: 'session-end',
  PERFORMANCE_TRIGGERED: 'performance-triggered',
  ERROR_TRIGGERED: 'error-triggered'
};

// Survey templates
export const SURVEY_TEMPLATES = {
  GENERAL_SATISFACTION: {
    id: 'general-satisfaction',
    name: 'General Satisfaction Survey',
    description: 'Measure overall user satisfaction',
    questions: [
      {
        id: 'overall-satisfaction',
        type: 'rating',
        scale: 5,
        question: 'Overall, how satisfied are you with LingoLoopAI?',
        required: true
      },
      {
        id: 'recommend-likelihood',
        type: 'nps',
        question: 'How likely are you to recommend LingoLoopAI to others?',
        required: true
      },
      {
        id: 'ease-of-use',
        type: 'rating',
        scale: 5,
        question: 'How easy is LingoLoopAI to use?',
        required: true
      },
      {
        id: 'feature-satisfaction',
        type: 'matrix',
        features: ['transcription', 'analysis', 'playback', 'ui'],
        question: 'How satisfied are you with these features?',
        scale: 5
      },
      {
        id: 'improvement-suggestions',
        type: 'text',
        question: 'What improvements would you like to see?',
        required: false
      }
    ]
  },
  FEATURE_SPECIFIC: {
    id: 'feature-specific',
    name: 'Feature Feedback Survey',
    description: 'Collect feedback on specific features',
    questions: [
      {
        id: 'feature-used',
        type: 'select',
        question: 'Which feature did you use?',
        options: ['transcription', 'analysis', 'playback', 'upload', 'other'],
        required: true
      },
      {
        id: 'feature-satisfaction',
        type: 'rating',
        scale: 5,
        question: 'How satisfied are you with this feature?',
        required: true
      },
      {
        id: 'feature-ease',
        type: 'rating',
        scale: 5,
        question: 'How easy was this feature to use?',
        required: true
      },
      {
        id: 'feature-usefulness',
        type: 'rating',
        scale: 5,
        question: 'How useful is this feature for your learning?',
        required: true
      },
      {
        id: 'feature-issues',
        type: 'text',
        question: 'Did you encounter any issues with this feature?',
        required: false
      }
    ]
  },
  ONBOARDING_FEEDBACK: {
    id: 'onboarding-feedback',
    name: 'Onboarding Experience Survey',
    description: 'Evaluate the user onboarding experience',
    questions: [
      {
        id: 'onboarding-completion',
        type: 'rating',
        scale: 5,
        question: 'How easy was it to get started with LingoLoopAI?',
        required: true
      },
      {
        id: 'clarity-instructions',
        type: 'rating',
        scale: 5,
        question: 'How clear were the instructions and guidance?',
        required: true
      },
      {
        id: 'first-impression',
        type: 'rating',
        scale: 5,
        question: 'What is your overall first impression?',
        required: true
      },
      {
        id: 'missing-guidance',
        type: 'text',
        question: 'What guidance or information was missing?',
        required: false
      }
    ]
  },
  PERFORMANCE_FEEDBACK: {
    id: 'performance-feedback',
    name: 'Performance Feedback Survey',
    description: 'Collect feedback on application performance',
    questions: [
      {
        id: 'load-time',
        type: 'rating',
        scale: 5,
        question: 'How would you rate the application loading speed?',
        required: true
      },
      {
        id: 'transcription-speed',
        type: 'rating',
        scale: 5,
        question: 'How would you rate the transcription speed?',
        required: true
      },
      {
        id: 'responsiveness',
        type: 'rating',
        scale: 5,
        question: 'How responsive is the application?',
        required: true
      },
      {
        id: 'performance-issues',
        type: 'text',
        question: 'Have you experienced any performance issues?',
        required: false
      }
    ]
  }
};

// Feedback analysis rules
export const ANALYSIS_RULES = {
  SENTIMENT_ANALYSIS: {
    positive: ['great', 'excellent', 'amazing', 'love', 'perfect', 'awesome', 'fantastic', 'good', 'helpful'],
    negative: ['terrible', 'awful', 'hate', 'horrible', 'useless', 'broken', 'slow', 'confusing', 'frustrating'],
    neutral: ['okay', 'average', 'normal', 'decent', 'fine']
  },
  URGENCY_KEYWORDS: {
    critical: ['urgent', 'emergency', 'critical', 'broken', 'not working', 'immediately', 'asap'],
    high: ['problem', 'issue', 'bug', 'error', 'slow', 'difficult', 'confusing'],
    medium: ['suggestion', 'improvement', 'would like', 'wish'],
    low: ['nice to have', 'maybe', 'sometime', 'future']
  },
  CATEGORY_KEYWORDS: {
    'audio-upload': ['upload', 'file', 'audio', 'recording', 'size', 'format'],
    'transcription': ['transcription', 'transcribe', 'speech', 'text', 'accuracy', 'recognition'],
    'analysis': ['analysis', 'grammar', 'sentence', 'structure', 'ai', 'insights'],
    'playback': ['playback', 'audio', 'player', 'listen', 'controls', 'highlighting'],
    'ui-ux': ['interface', 'design', 'layout', 'navigation', 'buttons', 'menu'],
    'performance': ['slow', 'fast', 'loading', 'responsive', 'lag', 'performance'],
    'content': ['content', 'bbc', 'material', 'quality', 'difficulty'],
    'account': ['account', 'login', 'profile', 'settings', 'subscription'],
    'billing': ['payment', 'billing', 'price', 'cost', 'subscription', 'refund']
  }
};

// Analytics session tracking
export class AnalyticsSession {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.events = [];
    this.pageViews = [];
    this.featureUsage = {};
    this.errors = [];
    this.performanceMetrics = {};
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  trackEvent(eventType, eventData = {}) {
    const event = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      eventType,
      eventData,
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.events.push(event);
    this.processEvent(event);
  }

  trackPageView(pageUrl, title) {
    const pageView = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      url: pageUrl,
      title,
      referrer: document.referrer
    };

    this.pageViews.push(pageView);
    this.trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { pageUrl, title });
  }

  trackFeatureUsage(featureId, action, metadata = {}) {
    if (!this.featureUsage[featureId]) {
      this.featureUsage[featureId] = {
        useCount: 0,
        lastUsed: null,
        actions: {},
        totalTime: 0
      };
    }

    this.featureUsage[featureId].useCount++;
    this.featureUsage[featureId].lastUsed = new Date().toISOString();

    if (!this.featureUsage[featureId].actions[action]) {
      this.featureUsage[featureId].actions[action] = 0;
    }
    this.featureUsage[featureId].actions[action]++;

    this.trackEvent(ANALYTICS_EVENTS.FEATURE_USE, {
      featureId,
      action,
      ...metadata
    });
  }

  trackError(errorType, errorMessage, errorDetails = {}) {
    const error = {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString(),
      errorType,
      errorMessage,
      errorDetails,
      url: window.location.href,
      stackTrace: errorDetails.stack || null
    };

    this.errors.push(error);
    this.trackEvent(ANALYTICS_EVENTS.ERROR_OCCURRED, {
      errorType,
      errorMessage,
      ...errorDetails
    });
  }

  trackPerformance(metricName, value, unit = 'ms') {
    this.performanceMetrics[metricName] = {
      value,
      unit,
      timestamp: new Date().toISOString()
    };

    this.trackEvent(ANALYTICS_EVENTS.PAGE_LOAD, {
      metricName,
      value,
      unit
    });
  }

  processEvent(event) {
    // Process events for real-time analytics
    switch (event.eventType) {
      case ANALYTICS_EVENTS.ERROR_OCCURRED:
        this.handleErrorEvent(event);
        break;
      case ANALYTICS_EVENTS.FEATURE_USE:
        this.handleFeatureUsageEvent(event);
        break;
      case ANALYTICS_EVENTS.PAGE_LOAD:
        this.handlePerformanceEvent(event);
        break;
      default:
        break;
    }
  }

  handleErrorEvent(event) {
    // Trigger feedback collection for critical errors
    const { errorType, errorMessage } = event.eventData;
    if (errorType === 'critical' || errorMessage.includes('network')) {
      this.triggerFeedbackCollection('error', {
        errorType,
        errorMessage,
        eventId: event.sessionId
      });
    }
  }

  handleFeatureUsageEvent(event) {
    const { featureId, action } = event.eventData;

    // Trigger feedback after certain usage patterns
    const usage = this.featureUsage[featureId];
    if (usage && usage.useCount === 5) {
      this.triggerFeedbackCollection('feature-usage', {
        featureId,
        useCount: usage.useCount
      });
    }
  }

  handlePerformanceEvent(event) {
    const { metricName, value } = event.eventData;

    // Trigger feedback for poor performance
    if (metricName === 'page_load' && value > 5000) {
      this.triggerFeedbackCollection('performance', {
        metricName,
        value,
        threshold: 5000
      });
    }
  }

  triggerFeedbackCollection(trigger, data) {
    // Dispatch event for feedback system
    window.dispatchEvent(new CustomEvent('triggerFeedback', {
      detail: { trigger, data }
    }));
  }

  getSessionSummary() {
    const duration = new Date() - this.startTime;

    return {
      sessionId: this.sessionId,
      duration,
      eventCount: this.events.length,
      pageViewCount: this.pageViews.length,
      featureUsageCount: Object.keys(this.featureUsage).length,
      errorCount: this.errors.length,
      topFeatures: this.getTopFeatures(),
      performanceMetrics: this.performanceMetrics
    };
  }

  getTopFeatures(limit = 5) {
    return Object.entries(this.featureUsage)
      .sort(([,a], [,b]) => b.useCount - a.useCount)
      .slice(0, limit)
      .map(([featureId, data]) => ({ featureId, ...data }));
  }

  endSession() {
    this.trackEvent('session_end', {
      duration: new Date() - this.startTime,
      eventCount: this.events.length,
      pageViewCount: this.pageViews.length
    });

    return this.getSessionSummary();
  }
}

// Feedback analysis utilities
export const analyzeFeedback = (feedback) => {
  const analysis = {
    sentiment: 'neutral',
    urgency: 'low',
    categories: [],
    confidence: 0,
    keywords: [],
    suggestions: []
  };

  // Sentiment analysis
  const text = (feedback.message + ' ' + feedback.title).toLowerCase();
  let sentimentScore = 0;

  Object.entries(ANALYSIS_RULES.SENTIMENT_ANALYSIS).forEach(([sentiment, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      if (sentiment === 'positive') sentimentScore += matches.length;
      else if (sentiment === 'negative') sentimentScore -= matches.length;
      analysis.keywords.push(...matches.map(m => ({ word: m, sentiment })));
    }
  });

  analysis.sentiment = sentimentScore > 0 ? 'positive' : sentimentScore < 0 ? 'negative' : 'neutral';
  analysis.confidence = Math.abs(sentimentScore);

  // Urgency analysis
  Object.entries(ANALYSIS_RULES.URGENCY_KEYWORDS).forEach(([urgency, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      analysis.urgency = urgency;
      analysis.keywords.push(...matches.map(m => ({ word: m, urgency })));
    }
  });

  // Category classification
  Object.entries(ANALYSIS_RULES.CATEGORY_KEYWORDS).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => text.includes(keyword));
    if (matches.length > 0) {
      analysis.categories.push(category);
      analysis.keywords.push(...matches.map(m => ({ word: m, category })));
    }
  });

  // Generate suggestions
  analysis.suggestions = generateSuggestions(analysis, feedback);

  return analysis;
};

const generateSuggestions = (analysis, feedback) => {
  const suggestions = [];

  if (analysis.sentiment === 'negative' && analysis.urgency === 'critical') {
    suggestions.push({
      priority: 'high',
      action: 'immediate-response',
      message: 'Send immediate response to user'
    });
  }

  if (analysis.categories.includes('performance')) {
    suggestions.push({
      priority: 'medium',
      action: 'performance-investigation',
      message: 'Investigate performance issues'
    });
  }

  if (analysis.categories.includes('ui-ux')) {
    suggestions.push({
      priority: 'medium',
      action: 'ui-review',
      message: 'Review user interface design'
    });
  }

  if (feedback.type === FEEDBACK_TYPES.FEATURE_REQUEST) {
    suggestions.push({
      priority: 'low',
      action: 'feature-evaluation',
      message: 'Evaluate feature request for future development'
    });
  }

  return suggestions;
};

// Export utility functions
export const createFeedbackObject = (data) => {
  return {
    id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: data.userId || null,
    sessionId: data.sessionId || null,
    type: data.type || FEEDBACK_TYPES.GENERAL_FEEDBACK,
    category: data.category || FEEDBACK_CATEGORIES.OTHER,
    priority: data.priority || FEEDBACK_PRIORITIES.MEDIUM,
    status: FEEDBACK_STATUSES.OPEN,
    title: data.title,
    message: data.message,
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...data.metadata
    },
    attachments: data.attachments || [],
    tags: data.tags || [],
    assignee: data.assignee || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

export const validateFeedback = (feedback) => {
  const errors = [];

  if (!feedback.title || feedback.title.trim().length === 0) {
    errors.push('Title is required');
  }

  if (!feedback.message || feedback.message.trim().length === 0) {
    errors.push('Message is required');
  }

  if (!Object.values(FEEDBACK_TYPES).includes(feedback.type)) {
    errors.push('Invalid feedback type');
  }

  if (!Object.values(FEEDBACK_CATEGORIES).includes(feedback.category)) {
    errors.push('Invalid feedback category');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Create global analytics session instance
let globalAnalyticsSession = null;

export const getAnalyticsSession = () => {
  if (!globalAnalyticsSession) {
    globalAnalyticsSession = new AnalyticsSession();
  }
  return globalAnalyticsSession;
};

export const resetAnalyticsSession = () => {
  if (globalAnalyticsSession) {
    globalAnalyticsSession.endSession();
  }
  globalAnalyticsSession = new AnalyticsSession();
};