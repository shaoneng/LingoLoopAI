import React from 'react';

const SearchEmpty = ({ context, searchTerm, onClearSearch }) => {
  const handleClearSearch = () => {
    if (onClearSearch) {
      onClearSearch();
    }
  };

  const handleBrowseAll = () => {
    if (window.location) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="empty-state search-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="search-icon">🔍</div>
        </div>

        <div className="empty-state-message">
          <h2>搜索结果为空</h2>
          {searchTerm ? (
            <p>没有找到包含 "{searchTerm}" 的音频文件</p>
          ) : (
            <p>请输入搜索关键词来查找音频文件</p>
          )}
        </div>

        <div className="empty-state-actions">
          {searchTerm && (
            <button
              className="secondary-action"
              onClick={handleClearSearch}
            >
              <span className="action-icon">🗑️</span>
              清除搜索
            </button>
          )}

          <button
            className="primary-action"
            onClick={handleBrowseAll}
          >
            <span className="action-icon">📁</span>
            浏览所有音频
          </button>
        </div>

        {searchTerm && (
          <div className="search-suggestions">
            <h3>💡 搜索建议：</h3>
            <ul className="suggestions-list">
              <li>尝试使用不同的关键词</li>
              <li>检查拼写是否正确</li>
              <li>使用更宽泛的搜索词</li>
              <li>搜索文件名、标签或转写内容</li>
            </ul>
          </div>
        )}

        <div className="search-tips">
          <h3>🔍 搜索技巧：</h3>
          <div className="tips-grid">
            <div className="tip-item">
              <div className="tip-icon">📝</div>
              <div className="tip-content">
                <h4>搜索文件名</h4>
                <p>直接输入音频文件名</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">🏷️</div>
              <div className="tip-content">
                <h4>搜索标签</h4>
                <p>使用标签关键词查找</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">📄</div>
              <div className="tip-content">
                <h4>搜索内容</h4>
                <p>搜索转写文本内容</p>
              </div>
            </div>
            <div className="tip-item">
              <div className="tip-icon">📅</div>
              <div className="tip-content">
                <h4>搜索日期</h4>
                <p>按上传日期查找</p>
              </div>
            </div>
          </div>
        </div>

        <div className="quick-filters">
          <h3>🎯 快速筛选：</h3>
          <div className="filter-buttons">
            <button
              className="filter-btn"
              onClick={() => window.location.href = '/dashboard?filter=recent'}
            >
              最近上传
            </button>
            <button
              className="filter-btn"
              onClick={() => window.location.href = '/dashboard?filter=favorites'}
            >
              我的收藏
            </button>
            <button
              className="filter-btn"
              onClick={() => window.location.href = '/dashboard?filter=completed'}
            >
              已完成
            </button>
            <button
              className="filter-btn"
              onClick={() => window.location.href = '/dashboard?filter=bBC'}
            >
              BBC 内容
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchEmpty;