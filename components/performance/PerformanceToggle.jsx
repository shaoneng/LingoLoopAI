import React, { useState } from 'react';
import PerformancePanel from './PerformancePanel';
import { usePerformance } from '../../hooks/usePerformance';

/**
 * Performance monitoring toggle button
 * Provides quick access to performance metrics and optimization insights
 */
const PerformanceToggle = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { getPerformanceScore } = usePerformance();

  const performanceScore = getPerformanceScore();

  const handleToggle = () => {
    setShowPanel(!showPanel);
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <>
      <button
        onClick={handleToggle}
        className="performance-toggle"
        title="性能监控"
        aria-label="打开性能监控面板"
      >
        <span className="performance-icon">📊</span>
        <span className={`performance-score ${getScoreColor(performanceScore.score)}`}>
          {performanceScore.score}
        </span>
      </button>

      {showPanel && (
        <PerformancePanel onClose={() => setShowPanel(false)} />
      )}

      <style jsx>{`
        .performance-toggle {
          position: fixed;
          bottom: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 50px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 999;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .performance-toggle:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
          border-color: #3b82f6;
        }

        .performance-icon {
          font-size: 1rem;
        }

        .performance-score {
          font-weight: 700;
          font-size: 0.875rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .performance-toggle {
            bottom: 16px;
            left: 16px;
            padding: 0.625rem 0.875rem;
            font-size: 0.75rem;
          }

          .performance-icon {
            font-size: 0.875rem;
          }

          .performance-score {
            font-size: 0.75rem;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .performance-toggle {
            background: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }

          .performance-toggle:hover {
            border-color: #60a5fa;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .performance-toggle {
            transition: none;
          }

          .performance-toggle:hover {
            transform: none;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .performance-toggle {
            border-width: 2px;
          }
        }

        /* Print optimization */
        @media print {
          .performance-toggle {
            display: none;
          }
        }

        /* Focus visible optimization */
        .performance-toggle:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Loading state */
        .performance-toggle.loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .performance-toggle.loading .performance-icon::after {
          content: '';
          display: inline-block;
          width: 0.75rem;
          height: 0.75rem;
          margin-left: 0.5rem;
          border: 2px solid #e5e7eb;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Accessibility improvements */
        .performance-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .performance-toggle:disabled:hover {
          transform: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        /* Performance score colors */
        .text-green-600 { color: #059669; }
        .text-yellow-600 { color: #d97706; }
        .text-orange-600 { color: #ea580c; }
        .text-red-600 { color: #dc2626; }
      `}</style>
    </>
  );
};

export default PerformanceToggle;