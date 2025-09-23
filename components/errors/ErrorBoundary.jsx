import React from 'react';
import ErrorAlert from './ErrorAlert';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log error to monitoring service
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const error = {
        code: 'REACT_ERROR_BOUNDARY',
        message: this.state.error?.message || 'React component error',
        stack: this.state.error?.stack,
        componentStack: this.state.errorInfo?.componentStack,
        details: {
          errorBoundary: true,
          componentName: this.props.componentName || 'Unknown',
          timestamp: new Date().toISOString()
        }
      };

      return (
        <div className="error-boundary-fallback">
          <ErrorAlert
            error={error}
            onRetry={this.handleRetry}
            onDismiss={this.props.onDismiss}
          />

          {this.props.fallback && (
            <div className="error-fallback-content">
              {this.props.fallback}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;