import React, { useState, useEffect } from 'react';
import usePerformance from '../../hooks/usePerformance';
import useAnalytics from '../../hooks/useAnalytics';

/**
 * Performance monitoring and diagnostics panel
 * Shows real-time performance metrics and optimization suggestions
 */
const PerformancePanel = ({ onClose }) => {
  const {
    metrics,
    bundleAnalysis,
    isOnline,
    effectiveConnection,
    getPerformanceRecommendations,
    getPerformanceScore,
  } = usePerformance();

  const { trackEvent } = useAnalytics();
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const performanceScore = getPerformanceScore();
  const recommendations = getPerformanceRecommendations();

  useEffect(() => {
    trackEvent('performance_panel_opened');
  }, [trackEvent]);

  const formatMetric = (value, unit = 'ms') => {
    if (typeof value !== 'number') return 'N/A';
    if (unit === 'ms') return `${value.toFixed(2)}ms`;
    if (unit === 'bytes') return formatBytes(value);
    if (unit === 'score') return value.toFixed(2);
    return value.toString();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    if (score >= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const renderOverview = () => (
    <div className="performance-overview">
      <div className="score-card">
        <div className="score-display">
          <div className={`score-number ${getScoreColor(performanceScore.score)}`}>
            {performanceScore.score}
          </div>
          <div className="score-grade">
            Grade: <span className={getScoreColor(performanceScore.score)}>
              {performanceScore.grade}
            </span>
          </div>
        </div>
        <div className="score-details">
          <div className="score-item">
            <span className="score-label">FCP:</span>
            <span>{formatMetric(metrics.fcp?.value)}</span>
          </div>
          <div className="score-item">
            <span className="score-label">LCP:</span>
            <span>{formatMetric(metrics.lcp?.value)}</span>
          </div>
          <div className="score-item">
            <span className="score-label">FID:</span>
            <span>{formatMetric(metrics.fid?.value)}</span>
          </div>
          <div className="score-item">
            <span className="score-label">CLS:</span>
            <span>{formatMetric(metrics.cls?.value, 'score')}</span>
          </div>
        </div>
      </div>

      <div className="status-cards">
        <div className="status-card">
          <div className="status-icon">{isOnline ? '🟢' : '🔴'}</div>
          <div className="status-info">
            <div className="status-label">Network</div>
            <div className="status-value">{isOnline ? 'Online' : 'Offline'}</div>
          </div>
        </div>

        {effectiveConnection && (
          <div className="status-card">
            <div className="status-icon">📶</div>
            <div className="status-info">
              <div className="status-label">Connection</div>
              <div className="status-value">{effectiveConnection.effectiveType}</div>
              <div className="status-details">
                {effectiveConnection.downlink} Mbps ↓
              </div>
            </div>
          </div>
        )}

        {bundleAnalysis && (
          <div className="status-card">
            <div className="status-icon">📦</div>
            <div className="status-info">
              <div className="status-label">Bundle Size</div>
              <div className="status-value">{formatBytes(bundleAnalysis.totalSize)}</div>
              <div className="status-details">
                {bundleAnalysis.resourceCount} files
              </div>
            </div>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-section">
          <h3>Optimization Suggestions</h3>
          <div className="recommendations-list">
            {recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className={`recommendation-severity ${getSeverityColor(rec.severity)}`}>
                  {rec.severity.toUpperCase()}
                </div>
                <div className="recommendation-content">
                  <div className="recommendation-type">{rec.type}</div>
                  <div className="recommendation-message">{rec.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderMetrics = () => (
    <div className="metrics-grid">
      <div className="metric-card">
        <h4>Core Web Vitals</h4>
        <div className="metric-list">
          <div className="metric-item">
            <span className="metric-name">First Contentful Paint (FCP)</span>
            <span className="metric-value">{formatMetric(metrics.fcp?.value)}</span>
            <span className="metric-status">
              {metrics.fcp?.value > 1800 ? '🐌' : '✅'}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-name">Largest Contentful Paint (LCP)</span>
            <span className="metric-value">{formatMetric(metrics.lcp?.value)}</span>
            <span className="metric-status">
              {metrics.lcp?.value > 2500 ? '🐌' : '✅'}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-name">First Input Delay (FID)</span>
            <span className="metric-value">{formatMetric(metrics.fid?.value)}</span>
            <span className="metric-status">
              {metrics.fid?.value > 100 ? '🐌' : '✅'}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-name">Cumulative Layout Shift (CLS)</span>
            <span className="metric-value">{formatMetric(metrics.cls?.value, 'score')}</span>
            <span className="metric-status">
              {metrics.cls?.value > 0.1 ? '🐌' : '✅'}
            </span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <h4>Navigation Timing</h4>
        <div className="metric-list">
          <div className="metric-item">
            <span className="metric-name">Page Load Time</span>
            <span className="metric-value">{formatMetric(metrics.page_load_time?.value)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">DOM Complete</span>
            <span className="metric-value">{formatMetric(metrics.dom_complete?.value)}</span>
          </div>
          <div className="metric-item">
            <span className="metric-name">DOM Interactive</span>
            <span className="metric-value">{formatMetric(metrics.dom_interactive?.value)}</span>
          </div>
        </div>
      </div>

      <div className="metric-card">
        <h4>Resource Performance</h4>
        <div className="metric-list">
          {bundleAnalysis && (
            <>
              <div className="metric-item">
                <span className="metric-name">Total Bundle Size</span>
                <span className="metric-value">{formatBytes(bundleAnalysis.totalSize)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Load Time</span>
                <span className="metric-value">{formatMetric(bundleAnalysis.totalLoadTime)}</span>
              </div>
              <div className="metric-item">
                <span className="metric-name">Resource Count</span>
                <span className="metric-value">{bundleAnalysis.resourceCount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderBundle = () => (
    <div className="bundle-analysis">
      {bundleAnalysis ? (
        <>
          <div className="bundle-summary">
            <div className="summary-item">
              <span className="summary-label">Total Size:</span>
              <span className="summary-value">{formatBytes(bundleAnalysis.totalSize)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Load Time:</span>
              <span className="summary-value">{formatMetric(bundleAnalysis.totalLoadTime)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Resources:</span>
              <span className="summary-value">{bundleAnalysis.resourceCount}</span>
            </div>
          </div>

          <div className="bundle-resources">
            <h4>Individual Resources</h4>
            <div className="resource-list">
              {bundleAnalysis.resources.map((resource, index) => (
                <div key={index} className="resource-item">
                  <div className="resource-name">{resource.name}</div>
                  <div className="resource-stats">
                    <span className="resource-size">{formatBytes(resource.size)}</span>
                    <span className="resource-time">{formatMetric(resource.duration)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="no-data">No bundle analysis data available</div>
      )}
    </div>
  );

  const renderRecommendations = () => (
    <div className="recommendations-full">
      {recommendations.length > 0 ? (
        <div className="recommendations-grid">
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation-card">
              <div className={`recommendation-severity ${getSeverityColor(rec.severity)}`}>
                {rec.severity.toUpperCase()}
              </div>
              <div className="recommendation-type">{rec.type}</div>
              <div className="recommendation-message">{rec.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-recommendations">
          <div className="success-icon">✅</div>
          <h3>Great job!</h3>
          <p>No performance issues detected. Your application is running optimally.</p>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: '概览', icon: '📊' },
    { id: 'metrics', label: '指标', icon: '📈' },
    { id: 'bundle', label: '包分析', icon: '📦' },
    { id: 'recommendations', label: '建议', icon: '💡' },
  ];

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverview();
      case 'metrics': return renderMetrics();
      case 'bundle': return renderBundle();
      case 'recommendations': return renderRecommendations();
      default: return null;
    }
  };

  return (
    <div className="performance-panel">
      <div className="performance-header">
        <h2>性能监控</h2>
        <div className="performance-actions">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="action-button"
          >
            {showDetails ? '隐藏详情' : '显示详情'}
          </button>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>
      </div>

      <div className="performance-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="performance-content">
        {renderTabContent()}
      </div>

      {showDetails && (
        <div className="performance-details">
          <h4>Technical Details</h4>
          <div className="details-grid">
            <div className="detail-section">
              <h5>Network Information</h5>
              <pre>{JSON.stringify(effectiveConnection, null, 2)}</pre>
            </div>
            <div className="detail-section">
              <h5>Performance Metrics</h5>
              <pre>{JSON.stringify(metrics, null, 2)}</pre>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .performance-panel {
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .performance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .performance-header h2 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
        }

        .performance-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-button {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          color: #374151;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .close-button {
          width: 2rem;
          height: 2rem;
          border: none;
          background: none;
          color: #6b7280;
          font-size: 1.25rem;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .performance-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }

        .tab-button {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 1.5rem;
          border: none;
          background: none;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          font-weight: 500;
          border-bottom: 2px solid transparent;
        }

        .tab-button:hover {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-button.active {
          color: #3b82f6;
          background: white;
          border-bottom-color: #3b82f6;
        }

        .performance-content {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
        }

        .performance-overview {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .score-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .score-display {
          text-align: center;
        }

        .score-number {
          font-size: 3rem;
          font-weight: 700;
          line-height: 1;
        }

        .score-grade {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
        }

        .score-details {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          font-size: 0.875rem;
        }

        .score-label {
          color: #6b7280;
        }

        .status-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .status-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .status-icon {
          font-size: 1.5rem;
        }

        .status-info {
          flex: 1;
        }

        .status-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
        }

        .status-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .status-details {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .recommendations-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .recommendation-item {
          display: flex;
          gap: 0.75rem;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 0.75rem;
        }

        .recommendation-severity {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .recommendation-content {
          flex: 1;
        }

        .recommendation-type {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.25rem;
        }

        .recommendation-message {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .metric-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .metric-card h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .metric-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .metric-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .metric-item:last-child {
          border-bottom: none;
        }

        .metric-name {
          font-size: 0.875rem;
          color: #374151;
          flex: 1;
        }

        .metric-value {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .metric-status {
          font-size: 1rem;
        }

        .bundle-analysis {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .bundle-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .summary-item {
          text-align: center;
        }

        .summary-label {
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          font-weight: 500;
        }

        .summary-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 0.25rem;
        }

        .bundle-resources h4 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .resource-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .resource-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .resource-name {
          font-size: 0.875rem;
          color: #374151;
          font-family: monospace;
        }

        .resource-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .recommendations-full {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .recommendation-card {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 12px;
          padding: 1.25rem;
        }

        .recommendation-card .recommendation-severity {
          margin-bottom: 0.5rem;
        }

        .recommendation-card .recommendation-type {
          font-size: 1rem;
          margin-bottom: 0.5rem;
        }

        .no-recommendations {
          text-align: center;
          padding: 3rem;
        }

        .success-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .no-recommendations h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .no-recommendations p {
          color: #6b7280;
          margin: 0;
        }

        .performance-details {
          border-top: 1px solid #e5e7eb;
          padding: 2rem;
          background: #f9fafb;
        }

        .performance-details h4 {
          margin: 0 0 1rem 0;
          color: #1f2937;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .detail-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
        }

        .detail-section h5 {
          margin: 0 0 0.5rem 0;
          font-size: 0.875rem;
          font-weight: 600;
          color: #1f2937;
        }

        .detail-section pre {
          margin: 0;
          font-size: 0.75rem;
          color: #6b7280;
          overflow-x: auto;
        }

        .no-data {
          text-align: center;
          padding: 2rem;
          color: #6b7280;
        }

        .text-green-600 { color: #059669; }
        .text-yellow-600 { color: #d97706; }
        .text-orange-600 { color: #ea580c; }
        .text-red-600 { color: #dc2626; }
        .text-gray-600 { color: #4b5563; }
        .text-blue-600 { color: #2563eb; }
      `}</style>
    </div>
  );
};

export default PerformancePanel;