import React from 'react';

const UploadHelp = ({ uploadState }) => {
  const isProcessing = uploadState === 'uploading' || uploadState === 'processing' || uploadState === 'transcribing';
  const isComplete = uploadState === 'complete';
  const isError = uploadState === 'error';

  // Don't show help during processing or after completion
  if (isProcessing || isComplete || isError) {
    return null;
  }

  return (
    <div className="upload-help">
      <div className="help-header">
        <h3 className="help-title">💡 上传提示</h3>
      </div>

      <div className="help-content">
        <div className="help-section">
          <h4 className="help-section-title">🎵 推荐音频内容</h4>
          <ul className="help-list">
            <li className="help-item">
              <span className="help-icon">🎙️</span>
              <span>英语播客和对话节目</span>
            </li>
            <li className="help-item">
              <span className="help-icon">📰</span>
              <span>英语新闻和广播</span>
            </li>
            <li className="help-item">
              <span className="help-icon">🎤</span>
              <span>演讲和讲座录音</span>
            </li>
            <li className="help-item">
              <span className="help-icon">📚</span>
              <span>英语学习材料</span>
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h4 className="help-section-title">✨ 获得最佳效果</h4>
          <ul className="help-list">
            <li className="help-item">
              <span className="help-icon">🔊</span>
              <span>选择清晰无杂音的音频</span>
            </li>
            <li className="help-item">
              <span className="help-icon">🗣️</span>
              <span>标准英语发音效果最佳</span>
            </li>
            <li className="help-item">
              <span className="help-icon">⏱️</span>
              <span>推荐时长 2-15 分钟</span>
            </li>
            <li className="help-item">
              <span className="help-icon">🎯</span>
              <span>语速适中的内容更容易识别</span>
            </li>
          </ul>
        </div>

        <div className="help-section">
          <h4 className="help-section-title">🔧 支持的处理功能</h4>
          <div className="feature-grid">
            <div className="feature-item">
              <div className="feature-icon">🤖</div>
              <div className="feature-text">
                <div className="feature-title">智能转写</div>
                <div className="feature-desc">AI 驱动的语音识别</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">👥</div>
              <div className="feature-text">
                <div className="feature-title">说话人分离</div>
                <div className="feature-desc">自动识别不同说话人</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📝</div>
              <div className="feature-text">
                <div className="feature-title">时间戳标记</div>
                <div className="feature-desc">精确到秒的时间定位</div>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🧠</div>
              <div className="feature-text">
                <div className="feature-title">AI 分析</div>
                <div className="feature-desc">语法和结构分析</div>
              </div>
            </div>
          </div>
        </div>

        <div className="help-section">
          <h4 className="help-section-title">🚀 需要帮助？</h4>
          <div className="help-actions">
            <button className="help-button">
              <span className="button-icon">📖</span>
              查看使用教程
            </button>
            <button className="help-button">
              <span className="button-icon">💬</span>
              联系客服支持
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadHelp;