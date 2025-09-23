import React, { useState, useEffect } from 'react';
import { useLazyImage } from '../../hooks/usePerformance';

/**
 * Lazy loading image component with performance tracking
 * Supports placeholder, error handling, and smooth transitions
 */
const LazyImage = ({
  src,
  alt,
  placeholder = null,
  errorFallback = null,
  className = '',
  width,
  height,
  onLoad,
  onError,
  threshold = 0.1,
  rootMargin = '50px',
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  const {
    ref: imageRef,
    src: lazySrc,
    isLoaded: imageIsLoaded,
    error: imageError,
    handleLoad: handleLazyLoad,
    handleError: handleLazyError,
  } = useLazyImage(src, { threshold, rootMargin });

  // Handle image load
  const handleImageLoad = (e) => {
    setIsLoaded(true);
    setShowPlaceholder(false);
    handleLazyLoad(e);
    onLoad?.(e);
  };

  // Handle image error
  const handleImageError = (e) => {
    setHasError(true);
    setShowPlaceholder(false);
    handleLazyError(e);
    onError?.(e);
  };

  // Reset state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setShowPlaceholder(true);
  }, [src]);

  // Default placeholder component
  const defaultPlaceholder = (
    <div className="lazy-image-placeholder">
      <div className="placeholder-skeleton" />
      <div className="placeholder-icon">🖼️</div>
    </div>
  );

  // Default error fallback
  const defaultErrorFallback = (
    <div className="lazy-image-error">
      <div className="error-icon">❌</div>
      <div className="error-text">图片加载失败</div>
    </div>
  );

  // What to render
  let content = null;

  if (hasError && errorFallback !== null) {
    content = errorFallback || defaultErrorFallback;
  } else if (showPlaceholder && placeholder !== null) {
    content = placeholder || defaultPlaceholder;
  } else {
    content = (
      <img
        ref={imageRef}
        src={lazySrc}
        alt={alt}
        className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${className}`}
        width={width}
        height={height}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
        {...props}
      />
    );
  }

  return (
    <div className="lazy-image-container" style={{ width, height }}>
      {content}
      <style jsx>{`
        .lazy-image-container {
          position: relative;
          display: inline-block;
          overflow: hidden;
          border-radius: 8px;
        }

        .lazy-image {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .lazy-image.loading {
          filter: blur(2px);
        }

        .lazy-image.loaded {
          filter: none;
        }

        .lazy-image-placeholder {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
          color: #6b7280;
        }

        .placeholder-skeleton {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }

        .placeholder-icon {
          position: relative;
          z-index: 1;
          font-size: 2rem;
          opacity: 0.5;
        }

        .lazy-image-error {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #fef2f2;
          color: #dc2626;
          text-align: center;
          padding: 1rem;
        }

        .error-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .error-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .lazy-image-placeholder,
          .lazy-image-error {
            border-radius: 6px;
          }

          .placeholder-icon {
            font-size: 1.5rem;
          }

          .error-icon {
            font-size: 1.5rem;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .lazy-image-placeholder {
            background: #374151;
            color: #9ca3af;
          }

          .placeholder-skeleton {
            background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
            background-size: 200% 100%;
          }

          .lazy-image-error {
            background: #7f1d1d;
            color: #fca5a5;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .lazy-image {
            transition: none;
          }

          .placeholder-skeleton {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Avatar component with lazy loading
 */
const LazyAvatar = ({ src, alt, name, size = 'medium', ...props }) => {
  const sizeClasses = {
    small: 'w-8 h-8 text-sm',
    medium: 'w-12 h-12 text-base',
    large: 'w-16 h-16 text-lg',
    xlarge: 'w-24 h-24 text-xl',
  };

  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const placeholder = (
    <div className="avatar-placeholder">
      <span className="avatar-initials">{getInitials(name || alt)}</span>
    </div>
  );

  const errorFallback = (
    <div className="avatar-error">
      <span className="avatar-initials">{getInitials(name || alt)}</span>
    </div>
  );

  return (
    <LazyImage
      src={src}
      alt={alt}
      placeholder={placeholder}
      errorFallback={errorFallback}
      className={`avatar ${sizeClasses[size] || sizeClasses.medium}`}
      {...props}
    />
  );
};

/**
 * Background image component with lazy loading
 */
const LazyBackground = ({
  src,
  children,
  placeholder = null,
  overlay = false,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { ref: bgRef, src: lazySrc } = useLazyImage(src);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const style = {
    backgroundImage: lazySrc && !hasError ? `url(${lazySrc})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 1 : 0,
  };

  return (
    <div
      ref={bgRef}
      className={`lazy-background ${className}`}
      style={style}
      {...props}
    >
      {!isLoaded && !hasError && placeholder}
      {overlay && (
        <div className="lazy-background-overlay">
          {children}
        </div>
      )}
      {!overlay && children}
      <style jsx>{`
        .lazy-background {
          position: relative;
          min-height: 200px;
        }

        .lazy-background-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .lazy-background {
            min-height: 150px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .lazy-background {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

LazyImage.Avatar = LazyAvatar;
LazyImage.Background = LazyBackground;

export default LazyImage;