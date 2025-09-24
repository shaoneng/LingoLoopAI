/**
 * User preferences persistence utilities
 * Provides localStorage management with optimistic updates and backend sync
 */

const STORAGE_KEY = 'lingoloop.user-preferences.v1';

export const PREFERENCE_TYPES = {
  APPEARANCE: 'appearance',
  AUDIO: 'audio',
  TRANSCRIPT: 'transcript',
  UPLOAD: 'upload',
  NOTIFICATIONS: 'notifications',
  ACCESSIBILITY: 'accessibility',
  EXPERIMENTAL: 'experimental'
};

export const DEFAULT_PREFERENCES = {
  // Appearance preferences
  [PREFERENCE_TYPES.APPEARANCE]: {
    theme: 'system', // 'light', 'dark', 'system'
    language: 'zh-CN',
    fontSize: 'medium', // 'small', 'medium', 'large'
    reducedMotion: false,
    highContrast: false,
    denseMode: false
  },

  // Audio preferences
  [PREFERENCE_TYPES.AUDIO]: {
    defaultPlaybackRate: 1.0,
    defaultVolume: 0.8,
    autoPlay: false,
    loopByDefault: false,
    showAdvancedControls: true,
    rememberVolume: true,
    skipSilence: false,
    crossfade: false
  },

  // Transcript preferences
  [PREFERENCE_TYPES.TRANSCRIPT]: {
    fontSize: 'medium',
    lineHeight: '1.6',
    showTimestamps: true,
    showSpeakerLabels: true,
    wordHighlighting: true,
    autoScroll: true,
    showAnalysis: true,
    displayMode: 'bilingual', // 'original', 'translation', 'bilingual'
    preferredEngine: 'google-speech-v2'
  },

  // Upload preferences
  [PREFERENCE_TYPES.UPLOAD]: {
    autoTranscribe: true,
    autoAnalyze: true,
    defaultLanguage: 'en-US',
    rememberLastSettings: true,
    showAdvancedOptions: false,
    enableDiarization: true,
    gapSeconds: 0.8,
    maxSpeakers: 2
  },

  // Notification preferences
  [PREFERENCE_TYPES.NOTIFICATIONS]: {
    emailNotifications: true,
    transcriptionComplete: true,
    analysisComplete: false,
    weeklyReports: true,
    featureUpdates: false,
    browserNotifications: false,
    soundEffects: true
  },

  // Accessibility preferences
  [PREFERENCE_TYPES.ACCESSIBILITY]: {
    keyboardNavigation: true,
    screenReader: false,
    largeText: false,
    highContrastMode: false,
    reducedAnimations: false,
    focusIndicators: true,
    dyslexiaFont: false
  },

  // Experimental features
  [PREFERENCE_TYPES.EXPERIMENTAL]: {
    enableBetaFeatures: false,
    aiSuggestions: true,
    voiceCommands: false,
    gestureControls: false,
    offlineMode: false,
    advancedAnalytics: false
  }
};

class PreferencesManager {
  constructor() {
    this.cache = null;
    this.listeners = new Map();
    this.saving = false;
    this.queue = [];
  }

  /**
   * Load preferences from localStorage
   */
  load() {
    if (this.cache) return this.cache;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        this.cache = this.deepClone(DEFAULT_PREFERENCES);
        this.save();
        return this.cache;
      }

      const parsed = JSON.parse(stored);
      // Merge with defaults to handle new preference additions
      this.cache = this.mergeWithDefaults(parsed);
      return this.cache;
    } catch (error) {
      console.warn('Failed to load preferences:', error);
      this.cache = this.deepClone(DEFAULT_PREFERENCES);
      return this.cache;
    }
  }

  /**
   * Get a specific preference value
   */
  get(type, key = null) {
    const prefs = this.load();
    if (key === null) return prefs[type];
    return prefs[type]?.[key] ?? DEFAULT_PREFERENCES[type]?.[key];
  }

  /**
   * Set a preference value
   */
  set(type, key, value) {
    const prefs = this.load();
    if (!prefs[type]) {
      prefs[type] = {};
    }

    const oldValue = prefs[type][key];
    prefs[type][key] = value;

    this.cache = prefs;
    this.notifyListeners(type, key, value, oldValue);
    this.scheduleSave();
  }

  /**
   * Set multiple preferences at once
   */
  setMultiple(updates) {
    const prefs = this.load();
    const changes = [];

    updates.forEach(({ type, key, value }) => {
      if (!prefs[type]) {
        prefs[type] = {};
      }

      const oldValue = prefs[type][key];
      prefs[type][key] = value;
      changes.push({ type, key, value, oldValue });
    });

    this.cache = prefs;
    changes.forEach(({ type, key, value, oldValue }) => {
      this.notifyListeners(type, key, value, oldValue);
    });
    this.scheduleSave();
  }

  /**
   * Reset a preference to default
   */
  reset(type, key = null) {
    const prefs = this.load();

    if (key === null) {
      // Reset entire category
      const oldValues = prefs[type];
      prefs[type] = { ...DEFAULT_PREFERENCES[type] };
      this.cache = prefs;

      // Notify all changes in this category
      Object.keys(oldValues).forEach(k => {
        if (oldValues[k] !== DEFAULT_PREFERENCES[type][k]) {
          this.notifyListeners(type, k, DEFAULT_PREFERENCES[type][k], oldValues[k]);
        }
      });
    } else {
      // Reset specific key
      const oldValue = prefs[type]?.[key];
      const defaultValue = DEFAULT_PREFERENCES[type]?.[key];
      if (oldValue !== defaultValue) {
        prefs[type][key] = defaultValue;
        this.cache = prefs;
        this.notifyListeners(type, key, defaultValue, oldValue);
      }
    }

    this.scheduleSave();
  }

  /**
   * Reset all preferences to defaults
   */
  resetAll() {
    const oldPrefs = this.cache;
    this.cache = this.deepClone(DEFAULT_PREFERENCES);

    // Notify all changes
    Object.keys(PREFERENCE_TYPES).forEach(type => {
      Object.keys(oldPrefs[type] || {}).forEach(key => {
        if (oldPrefs[type][key] !== DEFAULT_PREFERENCES[type][key]) {
          this.notifyListeners(type, key, DEFAULT_PREFERENCES[type][key], oldPrefs[type][key]);
        }
      });
    });

    this.scheduleSave();
  }

  /**
   * Subscribe to preference changes
   */
  subscribe(type, key, callback) {
    const listenerId = Symbol();
    const fullKey = `${type}.${key}`;

    if (!this.listeners.has(fullKey)) {
      this.listeners.set(fullKey, new Map());
    }

    this.listeners.get(fullKey).set(listenerId, callback);

    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(fullKey);
      if (keyListeners) {
        keyListeners.delete(listenerId);
        if (keyListeners.size === 0) {
          this.listeners.delete(fullKey);
        }
      }
    };
  }

  /**
   * Export preferences as JSON
   */
  export() {
    return JSON.stringify(this.load(), null, 2);
  }

  /**
   * Import preferences from JSON
   */
  import(jsonString) {
    try {
      const imported = JSON.parse(jsonString);
      const merged = this.mergeWithDefaults(imported);

      const oldPrefs = this.cache;
      this.cache = merged;

      // Notify all changes
      Object.keys(PREFERENCE_TYPES).forEach(type => {
        Object.keys(merged[type] || {}).forEach(key => {
          if (oldPrefs[type]?.[key] !== merged[type][key]) {
            this.notifyListeners(type, key, merged[type][key], oldPrefs[type]?.[key]);
          }
        });
      });

      this.scheduleSave();
      return true;
    } catch (error) {
      console.error('Failed to import preferences:', error);
      return false;
    }
  }

  /**
   * Sync preferences with backend
   */
  async syncWithBackend(accessToken) {
    if (!accessToken) return false;

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const backendPrefs = await response.json();
        this.mergeWithBackend(backendPrefs);
        return true;
      }
    } catch (error) {
      console.warn('Failed to sync preferences with backend:', error);
    }

    return false;
  }

  /**
   * Save preferences to backend
   */
  async saveToBackend(accessToken) {
    if (!accessToken || this.saving) return false;

    this.saving = true;

    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.load())
      });

      return response.ok;
    } catch (error) {
      console.warn('Failed to save preferences to backend:', error);
      return false;
    } finally {
      this.saving = false;
    }
  }

  // Private methods

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  mergeWithDefaults(stored) {
    const merged = this.deepClone(DEFAULT_PREFERENCES);

    Object.keys(stored).forEach(type => {
      if (merged[type]) {
        merged[type] = { ...merged[type], ...stored[type] };
      } else {
        merged[type] = stored[type];
      }
    });

    return merged;
  }

  mergeWithBackend(backendPrefs) {
    const current = this.load();
    const changes = [];

    Object.keys(backendPrefs).forEach(type => {
      if (current[type]) {
        Object.keys(backendPrefs[type]).forEach(key => {
          if (current[type][key] !== backendPrefs[type][key]) {
            const oldValue = current[type][key];
            current[type][key] = backendPrefs[type][key];
            changes.push({ type, key, value: backendPrefs[type][key], oldValue });
          }
        });
      }
    });

    if (changes.length > 0) {
      this.cache = current;
      changes.forEach(({ type, key, value, oldValue }) => {
        this.notifyListeners(type, key, value, oldValue);
      });
      this.scheduleSave();
    }
  }

  scheduleSave() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.save();
    }, 100);
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  notifyListeners(type, key, value, oldValue) {
    const fullKey = `${type}.${key}`;
    const keyListeners = this.listeners.get(fullKey);

    if (keyListeners) {
      keyListeners.forEach(callback => {
        try {
          callback(value, oldValue, type, key);
        } catch (error) {
          console.error('Preference listener error:', error);
        }
      });
    }
  }
}

// Create singleton instance
const preferencesManager = new PreferencesManager();

export default preferencesManager;

// Utility functions for common preference operations
export const getAppearancePreference = (key) =>
  preferencesManager.get(PREFERENCE_TYPES.APPEARANCE, key);

export const getAudioPreference = (key) =>
  preferencesManager.get(PREFERENCE_TYPES.AUDIO, key);

export const getTranscriptPreference = (key) =>
  preferencesManager.get(PREFERENCE_TYPES.TRANSCRIPT, key);

export const setAppearancePreference = (key, value) =>
  preferencesManager.set(PREFERENCE_TYPES.APPEARANCE, key, value);

export const setAudioPreference = (key, value) =>
  preferencesManager.set(PREFERENCE_TYPES.AUDIO, key, value);

export const setTranscriptPreference = (key, value) =>
  preferencesManager.set(PREFERENCE_TYPES.TRANSCRIPT, key, value);