import React from 'react';

const AudioListEmpty = ({ context, onUpload }) => {
  const { user, experienceLevel } = context;

  const handleUpload = () => {
    if (onUpload) {
      onUpload();
    } else {
      if (window.openUploadModal) {
        window.openUploadModal();
      }
    }
  };

  const handleTryDemo = () => {
    if (window.location) {
      window.location.href = '/demo';
    }
  };

  return (
    <div className="empty-state audio-list-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="audio-icon">🎵</div>
        </div>

        <div className="empty-state-message">
          <h2>还没有音频文件</h2>
          <p>开始上传您的第一个英语音频文件，开始智能学习之旅</p>
        </div>

        <div className="empty-state-actions">
          <button
            className="primary-action"
            onClick={handleUpload}
          >
            <span className="action-icon">📁</span>
            上传音频文件
          </button>

          <button
            className="secondary-action"
            onClick={handleTryDemo}
          >
            <span className="action-icon">🎮</span>
            试试演示内容
          </button>
        </div>

        <div className="upload-guide">
          <h3>支持格式：</h3>
          <div className="supported-formats">
            <div className="format-item">
              <span className="format-icon">🎵</span>
              <span className="format-name">MP3</span>
            </div>
            <div className="format-item">
              <span className="format-icon">🎵</span>
              <span className="format-name">WAV</span>
            </div>
            <div className="format-item">
              <span className="format-icon">🎵</span>
              <span className="format-name">M4A</span>
            </div>
            <div className="format-item">
              <span className="format-icon">🎵</span>
              <span className="format-name">AAC</span>
            </div>
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

        {experienceLevel === 'beginner' && (
          <div className="tips-section">
            <h3>💡 新手提示</h3>
            <ul className="tips-list">
              <li>建议从 1-5 分钟的短音频开始</li>
              <li>选择清晰发音的英语内容</li>
              <li>可以先试试 BBC 6 Minute English</li>
              <li>上传后系统会自动转写和分析</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioListEmpty;