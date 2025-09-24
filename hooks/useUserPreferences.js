import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import preferencesManager, {
  PREFERENCE_TYPES,
  getAppearancePreference,
  getAudioPreference,
  getTranscriptPreference,
  setAppearancePreference,
  setAudioPreference,
  setTranscriptPreference
} from '../utils/persist';

/**
 * React hook for managing user preferences
 * Provides reactive state management with localStorage persistence and backend sync
 */
export const useUserPreferences = () => {
  const { accessToken, user } = useAuth();
  const [preferences, setPreferencesState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const listenersRef = useRef(new Map());

  // Load preferences on mount
  useEffect(() => {
    const loadPreferences = () => {
      try {
        const prefs = preferencesManager.load();
        setPreferencesState(prefs);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, []);

  // Sync with backend when user is authenticated
  useEffect(() => {
    if (user && accessToken && preferences) {
      const syncWithBackend = async () => {
        setSyncing(true);
        try {
          await preferencesManager.syncWithBackend(accessToken);
          setLastSync(new Date());
        } catch (error) {
          console.warn('Backend sync failed:', error);
        } finally {
          setSyncing(false);
        }
      };

      // Sync on mount and when user changes
      syncWithBackend();

      // Set up periodic sync (every 5 minutes)
      const syncInterval = setInterval(syncWithBackend, 5 * 60 * 1000);

      return () => {
        clearInterval(syncInterval);
      };
    }
  }, [user, accessToken, preferences]);

  // Auto-save to backend when preferences change
  useEffect(() => {
    if (!user || !accessToken || !preferences) return;

    const saveTimeout = setTimeout(async () => {
      try {
        await preferencesManager.saveToBackend(accessToken);
      } catch (error) {
        console.warn('Auto-save to backend failed:', error);
      }
    }, 2000); // Debounce saves

    return () => {
      clearTimeout(saveTimeout);
    };
  }, [preferences, user, accessToken]);

  // Subscribe to preference changes
  const subscribe = useCallback((type, key, callback) => {
    const unsubscribe = preferencesManager.subscribe(type, key, (newValue, oldValue) => {
      // Update React state
      setPreferencesState(prev => {
        if (!prev) return prev;

        const updated = { ...prev };
        if (!updated[type]) {
          updated[type] = {};
        }
        updated[type][key] = newValue;
        return updated;
      });

      // Call local callback
      if (callback) {
        callback(newValue, oldValue, type, key);
      }
    });

    return unsubscribe;
  }, []);

  // Get a preference value
  const getPreference = useCallback((type, key = null) => {
    if (!preferences) {
      return preferencesManager.get(type, key);
    }
    return key === null ? preferences[type] : preferences[type]?.[key];
  }, [preferences]);

  // Set a preference value
  const setPreference = useCallback((type, key, value) => {
    preferencesManager.set(type, key, value);
    // State will be updated via subscription
  }, []);

  // Set multiple preferences at once
  const setPreferences = useCallback((updates) => {
    preferencesManager.setMultiple(updates);
    // State will be updated via subscriptions
  }, []);

  // Reset a preference to default
  const resetPreference = useCallback((type, key = null) => {
    preferencesManager.reset(type, key);
    // State will be updated via subscriptions
  }, []);

  // Reset all preferences to defaults
  const resetAllPreferences = useCallback(() => {
    preferencesManager.resetAll();
    // State will be updated via subscriptions
  }, []);

  // Export preferences
  const exportPreferences = useCallback(() => {
    return preferencesManager.export();
  }, []);

  // Import preferences
  const importPreferences = useCallback((jsonString) => {
    return preferencesManager.import(jsonString);
  }, []);

  // Convenience getters for common preference types
  const appearance = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.APPEARANCE, key);
  }, [getPreference]);

  const audio = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.AUDIO, key);
  }, [getPreference]);

  const transcript = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.TRANSCRIPT, key);
  }, [getPreference]);

  const upload = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.UPLOAD, key);
  }, [getPreference]);

  const notifications = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.NOTIFICATIONS, key);
  }, [getPreference]);

  const accessibility = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.ACCESSIBILITY, key);
  }, [getPreference]);

  const experimental = useCallback((key = null) => {
    return getPreference(PREFERENCE_TYPES.EXPERIMENTAL, key);
  }, [getPreference]);

  // Convenience setters for common preference types
  const setAppearance = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.APPEARANCE, key, value);
  }, [setPreference]);

  const setAudio = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.AUDIO, key, value);
  }, [setPreference]);

  const setTranscript = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.TRANSCRIPT, key, value);
  }, [setPreference]);

  const setUpload = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.UPLOAD, key, value);
  }, [setPreference]);

  const setNotifications = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.NOTIFICATIONS, key, value);
  }, [setPreference]);

  const setAccessibility = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.ACCESSIBILITY, key, value);
  }, [setPreference]);

  const setExperimental = useCallback((key, value) => {
    setPreference(PREFERENCE_TYPES.EXPERIMENTAL, key, value);
  }, [setPreference]);

  // Apply theme to document
  useEffect(() => {
    if (!preferences) return;

    const theme = preferences[PREFERENCE_TYPES.APPEARANCE]?.theme || 'system';

    const applyTheme = (themeValue) => {
      if (themeValue === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    if (theme === 'system') {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(darkModeQuery.matches ? 'dark' : 'light');

      const handleChange = (e) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };

      darkModeQuery.addEventListener('change', handleChange);
      return () => darkModeQuery.removeEventListener('change', handleChange);
    } else {
      applyTheme(theme);
    }
  }, [preferences]);

  // Apply accessibility preferences
  useEffect(() => {
    if (!preferences) return;

    const accessPrefs = preferences[PREFERENCE_TYPES.ACCESSIBILITY] || {};

    // Reduced motion
    if (accessPrefs.reducedAnimations) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // High contrast
    if (accessPrefs.highContrastMode) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Large text
    if (accessPrefs.largeText) {
      document.documentElement.classList.add('large-text');
    } else {
      document.documentElement.classList.remove('large-text');
    }

    // Dyslexia font
    if (accessPrefs.dyslexiaFont) {
      document.documentElement.classList.add('dyslexia-font');
    } else {
      document.documentElement.classList.remove('dyslexia-font');
    }
  }, [preferences]);

  return {
    // State
    preferences,
    loading,
    syncing,
    lastSync,

    // Core methods
    get: getPreference,
    set: setPreference,
    setMultiple: setPreferences,
    reset: resetPreference,
    resetAll: resetAllPreferences,
    subscribe,

    // Data management
    export: exportPreferences,
    import: importPreferences,

    // Convenience getters
    appearance,
    audio,
    transcript,
    upload,
    notifications,
    accessibility,
    experimental,

    // Convenience setters
    setAppearance,
    setAudio,
    setTranscript,
    setUpload,
    setNotifications,
    setAccessibility,
    setExperimental,

    // Constants
    types: PREFERENCE_TYPES
  };
};

export default useUserPreferences;