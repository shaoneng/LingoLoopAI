import React, { Suspense, Component } from 'react';

// Import performance utilities directly to avoid circular dependencies
import performanceMonitor from '../../utils/performance';

/**
 * Higher-order component for lazy loading with performance tracking
 */
export const withLazyLoading = (WrappedComponent, options = {}) => {
  const LazyComponent = React.lazy(() => Promise.resolve({ default: WrappedComponent }));

  return (props) => (
    <Suspense fallback={options.fallback || <DefaultLoadingFallback />}>
      <ErrorBoundary fallback={options.errorFallback || <LazyLoadError />}>
        <LazyComponent {...props} />
      </ErrorBoundary>
    </Suspense>
  );
};

/**
 * Route-level lazy loading component
 */
export const LazyRoute = ({ importFn, path, exact = false, fallback = null }) => {
  const LazyComponent = createLazyComponent(importFn, fallback);

  return (
    <LazyComponent path={path} exact={exact} />
  );
};

/**
 * Component that lazy loads children based on visibility
 */
class LazyVisibility extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isVisible: false,
      hasBeenVisible: false,
    };
    this.observer = null;
    this.containerRef = React.createRef();
  }

  componentDidMount() {
    this.setupIntersectionObserver();
  }

  componentWillUnmount() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  setupIntersectionObserver() {
    const { threshold = 0.1, rootMargin = '50px' } = this.props;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !this.state.hasBeenVisible) {
            this.setState({
              isVisible: true,
              hasBeenVisible: true,
            });
            this.observer.unobserve(this.containerRef.current);
            this.props.onVisible?.();
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (this.containerRef.current) {
      this.observer.observe(this.containerRef.current);
    }
  }

  render() {
    const { children, placeholder, className } = this.props;
    const { isVisible } = this.state;

    return (
      <div ref={this.containerRef} className={`lazy-visibility ${className || ''}`}>
        {isVisible ? children : placeholder}
        <style jsx>{`
          .lazy-visibility {
            min-height: 100px;
          }

          /* Responsive design */
          @media (max-width: 768px) {
            .lazy-visibility {
              min-height: 50px;
            }
          }
        `}</style>
      </div>
    );
  }
}

/**
 * Component that lazy loads based on user interaction
 */
class LazyInteraction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldLoad: false,
    };
  }

  handleInteraction = () => {
    if (!this.state.shouldLoad) {
      this.setState({ shouldLoad: true });
      this.props.onInteraction?.();
    }
  };

  render() {
    const { children, placeholder, trigger = 'hover', className } = this.props;
    const { shouldLoad } = this.state;

    const eventProps = {};
    if (trigger === 'hover') {
      eventProps.onMouseEnter = this.handleInteraction;
      eventProps.onFocus = this.handleInteraction;
    } else if (trigger === 'click') {
      eventProps.onClick = this.handleInteraction;
    }

    return (
      <div className={`lazy-interaction ${className || ''}`} {...eventProps}>
        {shouldLoad ? children : placeholder}
        <style jsx>{`
          .lazy-interaction {
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }
}

/**
 * Component that lazy loads based on delay
 */
class LazyDelay extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldLoad: false,
    };
  }

  componentDidMount() {
    const { delay = 1000 } = this.props;
    this.timer = setTimeout(() => {
      this.setState({ shouldLoad: true });
      this.props.onLoad?.();
    }, delay);
  }

  componentWillUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  render() {
    const { children, placeholder, className } = this.props;
    const { shouldLoad } = this.state;

    return (
      <div className={`lazy-delay ${className || ''}`}>
        {shouldLoad ? children : placeholder}
      </div>
    );
  }
}

/**
 * Component that lazy loads based on network conditions
 */
class LazyNetwork extends Component {
  constructor(props) {
    super(props);
    this.state = {
      shouldLoad: false,
    };
  }

  componentDidMount() {
    this.checkNetworkConditions();
  }

  checkNetworkConditions = () => {
    const {
      requireOnline = true,
      minConnectionType = '2g',
      requireSaveData = false
    } = this.props;

    // Check if online
    if (requireOnline && !navigator.onLine) {
      window.addEventListener('online', this.checkNetworkConditions);
      return;
    }

    // Check connection type
    if ('connection' in navigator) {
      const connection = navigator.connection;

      if (requireSaveData && connection.saveData) {
        return; // Don't load if data saver is enabled and required
      }

      const connectionTypes = ['slow-2g', '2g', '3g', '4g'];
      const requiredTypeIndex = connectionTypes.indexOf(minConnectionType);
      const currentTypeIndex = connectionTypes.indexOf(connection.effectiveType);

      if (currentTypeIndex < requiredTypeIndex) {
        // Wait for better connection
        connection.addEventListener('change', this.checkNetworkConditions);
        return;
      }
    }

    // All conditions met, load the component
    this.setState({ shouldLoad: true });
    this.props.onLoad?.();
  };

  componentWillUnmount() {
    // Clean up event listeners
    if ('connection' in navigator) {
      navigator.connection.removeEventListener('change', this.checkNetworkConditions);
    }
    window.removeEventListener('online', this.checkNetworkConditions);
  }

  render() {
    const { children, placeholder, className } = this.props;
    const { shouldLoad } = this.state;

    return (
      <div className={`lazy-network ${className || ''}`}>
        {shouldLoad ? children : placeholder}
      </div>
    );
  }
}

/**
 * Smart lazy loading component that combines multiple strategies
 */
const SmartLazy = ({
  children,
  placeholder,
  strategy = 'visibility',
  ...props
}) => {
  switch (strategy) {
    case 'visibility':
      return (
        <LazyVisibility placeholder={placeholder} {...props}>
          {children}
        </LazyVisibility>
      );

    case 'interaction':
      return (
        <LazyInteraction placeholder={placeholder} {...props}>
          {children}
        </LazyInteraction>
      );

    case 'delay':
      return (
        <LazyDelay placeholder={placeholder} {...props}>
          {children}
        </LazyDelay>
      );

    case 'network':
      return (
        <LazyNetwork placeholder={placeholder} {...props}>
          {children}
        </LazyNetwork>
      );

    default:
      return children;
  }
};

/**
 * Error boundary for lazy loaded components
 */
class LazyErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="lazy-error-fallback">
          <div className="error-icon">⚠️</div>
          <h3>组件加载失败</h3>
          <p>无法加载此组件，请刷新页面重试</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            刷新页面
          </button>
          <style jsx>{`
            .lazy-error-fallback {
              padding: 2rem;
              text-align: center;
              background: #fef2f2;
              border: 1px solid #fecaca;
              border-radius: 8px;
              color: #dc2626;
            }

            .error-icon {
              font-size: 2rem;
              margin-bottom: 1rem;
            }

            .lazy-error-fallback h3 {
              margin: 0 0 0.5rem 0;
              font-size: 1.125rem;
            }

            .lazy-error-fallback p {
              margin: 0 0 1rem 0;
              color: #991b1b;
            }

            .retry-button {
              padding: 0.5rem 1rem;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.875rem;
            }

            .retry-button:hover {
              background: #b91c1c;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default loading fallback
const DefaultLoadingFallback = () => (
  <div className="lazy-loading-fallback">
    <div className="loading-spinner" />
    <p>加载中...</p>
    <style jsx>{`
      .lazy-loading-fallback {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
      }

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #e5e7eb;
        border-top-color: #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
      }

      .lazy-loading-fallback p {
        color: #6b7280;
        font-size: 0.875rem;
        margin: 0;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// React Error Boundary for lazy loading
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
    if (performanceMonitor) {
      performanceMonitor.trackMetric('lazy_load_error', 1, {
        error: error.message,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <LazyLoadError error={this.state.error} />;
    }
    return this.props.children;
  }
}

const LazyLoadError = ({ error }) => (
  <div className="lazy-load-error">
    <div className="error-icon">⚠️</div>
    <h3>加载失败</h3>
    <p>组件加载失败，请刷新页面重试</p>
    {error && (
      <details className="error-details">
        <summary>错误详情</summary>
        <pre>{error.message}</pre>
      </details>
    )}
    <button
      onClick={() => window.location.reload()}
      className="retry-button"
    >
      刷新页面
    </button>
    <style jsx>{`
      .lazy-load-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        padding: 2rem;
        text-align: center;
      }

      .error-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .lazy-load-error h3 {
        margin: 0 0 0.5rem 0;
        color: #dc2626;
        font-size: 1.125rem;
      }

      .lazy-load-error p {
        color: #6b7280;
        margin: 0 0 1rem 0;
        font-size: 0.875rem;
      }

      .error-details {
        margin-bottom: 1rem;
        text-align: left;
        background: #fef2f2;
        border: 1px solid #fecaca;
        border-radius: 6px;
        padding: 0.75rem;
      }

      .error-details summary {
        cursor: pointer;
        color: #dc2626;
        font-weight: 500;
      }

      .error-details pre {
        margin: 0.5rem 0 0 0;
        font-size: 0.75rem;
        color: #991b1b;
        white-space: pre-wrap;
      }

      .retry-button {
        padding: 0.5rem 1rem;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: background 0.2s;
      }

      .retry-button:hover {
        background: #2563eb;
      }
    `}</style>
  </div>
);

// Export all components and utilities
export {
  LazyVisibility,
  LazyInteraction,
  LazyDelay,
  LazyNetwork,
  SmartLazy,
  LazyErrorBoundary,
  DefaultLoadingFallback,
};

export default SmartLazy;