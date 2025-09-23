import React from 'react';
import { useAdaptiveExperience } from '../../hooks/useAdaptiveExperience';

/**
 * Adaptive container that adjusts its behavior based on user experience level
 * and preferences. Provides progressive disclosure and contextual help.
 */
const AdaptiveContainer = ({
  children,
  featureId,
  helpContext,
  adaptationLevel = 'auto',
  className = '',
  ...props
}) => {
  const {
    experienceLevel,
    adaptations,
    shouldShowFeatureDiscovery,
    markFeatureDiscovered,
    getPersonalizedHelp,
    trackInteraction
  } = useAdaptiveExperience();

  const [showHelp, setShowHelp] = React.useState(false);
  const [showDiscovery, setShowDiscovery] = React.useState(false);

  // Determine if this feature should be discovered
  const shouldDiscover = featureId && shouldShowFeatureDiscovery(featureId);

  // Get adaptive styling based on experience level
  const getAdaptiveStyles = () => {
    const baseStyles = 'adaptive-container transition-all duration-300';

    switch (experienceLevel.id) {
      case 'beginner':
        return `${baseStyles} bg-blue-50 border-blue-200 rounded-lg p-4`;
      case 'intermediate':
        return `${baseStyles} bg-gray-50 border-gray-200 rounded-md p-3`;
      case 'advanced':
        return `${baseStyles} bg-white border-gray-100 rounded p-2`;
      case 'expert':
        return `${baseStyles} bg-transparent border-transparent p-1`;
      default:
        return baseStyles;
    }
  };

  // Get content density based on experience level
  const getContentDensity = () => {
    switch (experienceLevel.id) {
      case 'beginner':
        return 'spacious';
      case 'intermediate':
        return 'balanced';
      case 'advanced':
        return 'dense';
      case 'expert':
        return 'compact';
      default:
        return 'balanced';
    }
  };

  // Handle interaction tracking
  const handleInteraction = (type) => {
    trackInteraction(type, {
      feature_id: featureId,
      experience_level: experienceLevel.id
    });
  };

  // Handle feature discovery
  const handleDiscoveryComplete = () => {
    if (featureId) {
      markFeatureDiscovered(featureId);
      setShowDiscovery(false);
      handleInteraction('feature_discovered');
    }
  };

  // Render progressive disclosure content
  const renderProgressiveDisclosure = () => {
    if (!adaptations.progressiveDisclosure) return children;

    // For beginners, show simplified version first
    if (experienceLevel.id === 'beginner') {
      return (
        <div className="progressive-disclosure">
          <div className="basic-content">
            {children}
          </div>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="text-blue-600 text-sm mt-2 hover:underline"
          >
            {showHelp ? '收起详情' : '查看更多选项'}
          </button>
          {showHelp && (
            <div className="advanced-content mt-3 p-3 bg-blue-100 rounded-md">
              <p className="text-sm text-blue-800">
                {getPersonalizedHelp(helpContext)}
              </p>
            </div>
          )}
        </div>
      );
    }

    return children;
  };

  // Render feature discovery tooltip
  const renderFeatureDiscovery = () => {
    if (!shouldDiscover || !showDiscovery) return null;

    return (
      <div className="feature-discovery absolute z-50 bg-yellow-100 border border-yellow-300 rounded-lg p-4 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-xl">💡</span>
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-900 mb-1">发现新功能</h4>
            <p className="text-sm text-yellow-700 mb-3">
              {getPersonalizedHelp(helpContext)}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleDiscoveryComplete}
                className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                知道了
              </button>
              <button
                onClick={() => setShowDiscovery(false)}
                className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded hover:bg-yellow-200"
              >
                稍后提醒
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render contextual help
  const renderContextualHelp = () => {
    if (!adaptations.enhancedHelp || !showHelp) return null;

    return (
      <div className="contextual-help mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600">ℹ️</span>
          <div className="flex-1">
            <p className="text-sm text-blue-800">
              {getPersonalizedHelp(helpContext)}
            </p>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-blue-600 hover:text-blue-800"
          >
            ×
          </button>
        </div>
      </div>
    );
  };

  // Render help trigger
  const renderHelpTrigger = () => {
    if (!adaptations.enhancedHelp) return null;

    return (
      <button
        onClick={() => {
          setShowHelp(!showHelp);
          handleInteraction('help_requested');
        }}
        className="help-trigger text-gray-400 hover:text-gray-600 transition-colors"
        title="获取帮助"
      >
        <span className="text-lg">?</span>
      </button>
    );
  };

  return (
    <div
      className={`${getAdaptiveStyles()} ${className} relative`}
      data-density={getContentDensity()}
      data-experience-level={experienceLevel.id}
      onMouseEnter={() => {
        if (shouldDiscover && !showDiscovery) {
          setShowDiscovery(true);
          handleInteraction('feature_discovery_shown');
        }
      }}
      {...props}
    >
      {/* Feature Discovery */}
      {renderFeatureDiscovery()}

      {/* Main Content */}
      <div className="adaptive-content">
        {renderProgressiveDisclosure()}
      </div>

      {/* Help System */}
      {renderContextualHelp()}

      {/* Help Trigger */}
      <div className="absolute top-2 right-2">
        {renderHelpTrigger()}
      </div>

      {/* Styling for different experience levels */}
      <style jsx>{`
        .adaptive-container {
          position: relative;
          transition: all 0.3s ease;
        }

        /* Beginner styles */
        .adaptive-container[data-experience-level="beginner"] {
          border-width: 2px;
        }

        /* Intermediate styles */
        .adaptive-container[data-experience-level="intermediate"] {
          border-width: 1px;
        }

        /* Advanced styles */
        .adaptive-container[data-experience-level="advanced"] {
          border-width: 1px;
          border-style: dashed;
        }

        /* Expert styles */
        .adaptive-container[data-experience-level="expert"] {
          border-width: 0;
        }

        /* Density adjustments */
        .adaptive-container[data-density="spacious"] {
          line-height: 1.8;
          letter-spacing: 0.02em;
        }

        .adaptive-container[data-density="balanced"] {
          line-height: 1.6;
          letter-spacing: 0.01em;
        }

        .adaptive-container[data-density="dense"] {
          line-height: 1.4;
          letter-spacing: 0;
        }

        .adaptive-container[data-density="compact"] {
          line-height: 1.2;
          letter-spacing: -0.01em;
        }

        /* Focus states */
        .adaptive-container:focus-within {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Animation for feature discovery */
        .feature-discovery {
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        /* Accessibility */
        .help-trigger:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          border-radius: 4px;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .adaptive-container[data-experience-level="beginner"] {
            padding: 1rem;
          }

          .adaptive-container[data-experience-level="intermediate"] {
            padding: 0.75rem;
          }

          .adaptive-container[data-experience-level="advanced"],
          .adaptive-container[data-experience-level="expert"] {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveContainer;