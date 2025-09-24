import React from 'react';

const FavoritesEmpty = ({ context, onBrowse, onUpload }) => {
  const { user, experienceLevel } = context;

  const handleBrowse = () => {
    if (onBrowse) {
      onBrowse();
    } else {
      if (window.location) {
        window.location.href = '/dashboard';
      }
    }
  };

  const handleUpload = () => {
    if (onUpload) {
      onUpload();
    } else {
      if (window.openUploadModal) {
        window.openUploadModal();
      }
    }
  };

  return (
    <div className="empty-state favorites-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="favorites-icon">⭐</div>
        </div>

        <div className="empty-state-message">
          <h2>收藏夹为空</h2>
          <p>收藏您喜欢的音频文件，方便随时学习和回顾</p>
        </div>

        <div className="empty-state-actions">
          <button
            className="primary-action"
            onClick={handleBrowse}
          >
            <span className="action-icon">📁</span>
            浏览音频库
          </button>

          <button
            className="secondary-action"
            onClick={handleUpload}
          >
            <span className="action-icon">📤</span>
            上传新音频
          </button>
        </div>

        <div className="favorites-guide">
          <h3>💝 如何收藏音频：</h3>
          <div className="steps-guide">
            <div className="guide-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>浏览音频</h4>
                <p>在音频库中找到您喜欢的音频文件</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>点击收藏</h4>
                <p>点击音频卡片上的收藏按钮（⭐）</p>
              </div>
            </div>
            <div className="guide-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>查看收藏</h4>
                <p>在此页面查看所有收藏的音频</p>
              </div>
            </div>
          </div>
        </div>

        <div className="favorites-benefits">
          <h3>✨ 收藏功能的优势：</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">🎯</div>
              <div className="benefit-content">
                <h4>快速访问</h4>
                <p>快速找到常用的学习材料</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📚</div>
              <div className="benefit-content">
                <h4>学习整理</h4>
                <p>整理不同类型的学习内容</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">🔄</div>
              <div className="benefit-content">
                <h4>重复学习</h4>
                <p>方便重复练习重要内容</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📊</div>
              <div className="benefit-content">
                <h4>进度跟踪</h4>
                <p>跟踪收藏内容的学习进度</p>
              </div>
            </div>
          </div>
        </div>

        {experienceLevel === 'beginner' && (
          <div className="beginner-suggestions">
            <h3>💡 新手建议：</h3>
            <div className="suggestion-items">
              <div className="suggestion-item">
                <div className="suggestion-icon">🎵</div>
                <div className="suggestion-text">
                  <h4>收藏优质内容</h4>
                  <p>收藏质量高、适合自己水平的音频</p>
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-icon">📈</div>
                <div className="suggestion-text">
                  <h4>循序渐进</h4>
                  <p>从简单内容开始，逐步增加难度</p>
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-icon">🔄</div>
                <div className="suggestion-text">
                  <h4>定期复习</h4>
                  <p>定期回顾收藏的内容，巩固学习效果</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesEmpty;