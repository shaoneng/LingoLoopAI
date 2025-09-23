import React, { useState } from 'react';
import { getUserFriendlyError, getErrorDetails } from '../../utils/errorMessages';

const ErrorAlert = ({ error, onRetry, onDismiss, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!error) return null;

  const friendlyError = getUserFriendlyError(error);
  const errorDetails = getErrorDetails(error);

  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    }
  };

  const toggleDetails = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`error-alert ${className}`}>
      <div className="error-header">
        <div className="error-icon">⚠️</div>
        <div className="error-title">{friendlyError.title}</div>
        <button
          className="error-dismiss"
          onClick={handleDismiss}
          aria-label="关闭错误提示"
        >
          ✕
        </button>
      </div>

      <div className="error-content">
        <div className="error-message">{friendlyError.message}</div>

        {friendlyError.suggestion && (
          <div
            className="error-suggestion"
            dangerouslySetInnerHTML={{ __html: friendlyError.suggestion }}
          />
        )}

        <div className="error-actions">
          {onRetry && (
            <button
              className="error-retry"
              onClick={handleRetry}
            >
              {friendlyError.action}
            </button>
          )}

          {errorDetails && (
            <button
              className="error-details-toggle"
              onClick={toggleDetails}
            >
              {isExpanded ? '收起详情' : '查看详情'}
            </button>
          )}
        </div>

        {isExpanded && errorDetails && (
          <div className="error-details">
            <h4>技术详情：</h4>
            <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;