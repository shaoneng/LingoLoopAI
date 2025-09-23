import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import BeginnerDashboardEmpty from './BeginnerDashboardEmpty';
import AudioListEmpty from './AudioListEmpty';
import AnalyticsEmpty from './AnalyticsEmpty';
import ProgressEmpty from './ProgressEmpty';
import SearchEmpty from './SearchEmpty';
import FavoritesEmpty from './FavoritesEmpty';

const EmptyStates = {
  DASHBOARD: {
    beginner: BeginnerDashboardEmpty,
    intermediate: BeginnerDashboardEmpty, // For now, use same as beginner
    advanced: BeginnerDashboardEmpty // For now, use same as beginner
  },
  AUDIO_LIST: AudioListEmpty,
  ANALYTICS: AnalyticsEmpty,
  PROGRESS: ProgressEmpty,
  SEARCH: SearchEmpty,
  FAVORITES: FavoritesEmpty
};

const DEFAULT_EMPTY_STATE = ({ context }) => (
  <div className="default-empty-state">
    <div className="empty-state-icon">📭</div>
    <h3>暂无内容</h3>
    <p>这里还没有任何内容</p>
  </div>
);

const SmartEmptyState = ({ type, context = {} }) => {
  const { user } = useAuth();

  // Get user experience level (for now, default to beginner)
  const getExperienceLevel = () => {
    if (!user || !user.stats) return 'beginner';

    const { audioCount = 0 } = user.stats;
    if (audioCount >= 11) return 'advanced';
    if (audioCount >= 3) return 'intermediate';
    return 'beginner';
  };

  const experienceLevel = getExperienceLevel();

  const EmptyStateComponent = EmptyStates[type];

  if (!EmptyStateComponent) {
    return <DEFAULT_EMPTY_STATE context={{ ...context, user, experienceLevel }} />;
  }

  // For dashboard, use experience level to determine which empty state to show
  if (type === 'DASHBOARD') {
    const DashboardEmptyState = EmptyStates.DASHBOARD[experienceLevel];
    return <DashboardEmptyState context={{ ...context, user, experienceLevel }} />;
  }

  return <EmptyStateComponent context={{ ...context, user, experienceLevel }} />;
};

export default SmartEmptyState;