import React from 'react';

const formatFileSize = (bytes) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${mb.toFixed(1)} MB`;
};

const formatDuration = (ms) => {
  if (!ms || Number.isNaN(ms)) return '—';
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

const UploadContent = ({
  uploadState,
  file,
  audioDuration,
  error,
  status,
  onFileSelect,
  onRetry,
  onDrop,
  onDragOver,
  onFileInputChange,
  fileInputRef
}) => {
  const isProcessing = uploadState === 'uploading' || uploadState === 'processing' || uploadState === 'transcribing';
  const isComplete = uploadState === 'complete';
  const isError = uploadState === 'error';

  const handleDrop = (e) => {
    e.preventDefault();
    onDrop(e);
  };

  return (
    <div className="upload-content">
      {/* File Drop Zone */}
      {!file && !isProcessing && !isComplete && (
        <div
          className="file-drop-zone"
          onDrop={handleDrop}
          onDragOver={onDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={onFileInputChange}
            style={{ display: 'none' }}
            disabled={isProcessing}
          />

          <div className="drop-zone-icon">📁</div>
          <div className="drop-zone-title">
            拖拽音频文件到这里
          </div>
          <div className="drop-zone-subtitle">
            或点击选择文件
          </div>
          <button className="file-select-button">
            选择文件
          </button>

          <div className="supported-formats">
            <div className="format-item">MP3</div>
            <div className="format-item">WAV</div>
            <div className="format-item">M4A</div>
            <div className="format-item">AAC</div>
            <div className="format-item">FLAC</div>
          </div>

          <div className="upload-limits">
            <div className="limit-item">
              <span className="limit-icon">📏</span>
              <span>最大文件大小：100MB</span>
            </div>
            <div className="limit-item">
              <span className="limit-icon">⏱️</span>
              <span>最大时长：30分钟</span>
            </div>
          </div>
        </div>
      )}

      {/* File Info */}
      {file && (
        <div className="file-info-card">
          <div className="file-info-header">
            <div className="file-icon">🎵</div>
            <div className="file-details">
              <div className="file-name">{file.name}</div>
              <div className="file-meta">
                <span className="file-size">{formatFileSize(file.size)}</span>
                {audioDuration && (
                  <>
                    <span className="meta-separator">•</span>
                    <span className="file-duration">{formatDuration(audioDuration)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Audio Preview */}
          <div className="audio-preview">
            <audio
              controls
              src={URL.createObjectURL(file)}
              className="audio-player"
              preload="metadata"
            />
          </div>
        </div>
      )}

      {/* Status Message */}
      {status && !isError && (
        <div className="status-message">
          <div className="status-icon">
            {isProcessing && (
              <div className="loading-spinner"></div>
            )}
            {isComplete && '✅'}
          </div>
          <div className="status-text">{status}</div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-content">
            <div className="error-title">上传失败</div>
            <div className="error-text">{error}</div>
          </div>
          {onRetry && (
            <button className="retry-button" onClick={onRetry}>
              重试
            </button>
          )}
        </div>
      )}

      {/* Processing Animation */}
      {isProcessing && (
        <div className="processing-animation">
          <div className="processing-steps">
            <div className={`processing-step ${uploadState === 'uploading' ? 'active' : 'completed'}`}>
              <div className="step-indicator">
                <div className="step-icon">☁️</div>
                <div className="step-check">✓</div>
              </div>
              <div className="step-text">文件上传</div>
            </div>
            <div className={`processing-step ${uploadState === 'processing' ? 'active' : uploadState === 'transcribing' || uploadState === 'complete' ? 'completed' : 'pending'}`}>
              <div className="step-indicator">
                <div className="step-icon">⚡</div>
                <div className="step-check">✓</div>
              </div>
              <div className="step-text">数据处理</div>
            </div>
            <div className={`processing-step ${uploadState === 'transcribing' ? 'active' : uploadState === 'complete' ? 'completed' : 'pending'}`}>
              <div className="step-indicator">
                <div className="step-icon">🎯</div>
                <div className="step-check">✓</div>
              </div>
              <div className="step-text">智能转写</div>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {isComplete && (
        <div className="success-animation">
          <div className="success-icon">🎉</div>
          <div className="success-title">上传成功！</div>
          <div className="success-subtitle">您的音频文件已成功上传并处理</div>
        </div>
      )}
    </div>
  );
};

export default UploadContent;