import React from 'react';

const AnalyticsEmpty = ({ context }) => {
  const { user, experienceLevel } = context;

  const handleStartLearning = () => {
    if (window.location) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="empty-state analytics-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="analytics-icon">📊</div>
        </div>

        <div className="empty-state-message">
          <h2>学习数据统计</h2>
          <p>开始学习后，这里将显示您的详细学习数据和分析</p>
        </div>

        <div className="empty-state-actions">
          <button
            className="primary-action"
            onClick={handleStartLearning}
          >
            <span className="action-icon">🎯</span>
            开始学习
          </button>
        </div>

        <div className="preview-stats">
          <h3>📈 您将看到的数据：</h3>
          <div className="stats-grid">
            <div className="stat-preview">
              <div className="stat-icon">🎵</div>
              <div className="stat-content">
                <h4>学习时长</h4>
                <p>总学习时间和日均学习时间</p>
              </div>
            </div>
            <div className="stat-preview">
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h4>完成数量</h4>
                <p>完成的音频数量和学习会话</p>
              </div>
            </div>
            <div className="stat-preview">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <h4>连续天数</h4>
                <p>连续学习天数和学习记录</p>
              </div>
            </div>
            <div className="stat-preview">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <h4>成就徽章</h4>
                <p>获得的学习成就和技能认证</p>
              </div>
            </div>
          </div>
        </div>

        <div className="motivation-section">
          <h3>🎯 学习目标跟踪</h3>
          <div className="goal-tracking">
            <div className="goal-item">
              <span className="goal-icon">📅</span>
              <div className="goal-content">
                <h4>每日目标</h4>
                <p>设定每日学习时长目标</p>
              </div>
            </div>
            <div className="goal-item">
              <span className="goal-icon">📈</span>
              <div className="goal-content">
                <h4>进度对比</h4>
                <p>与历史数据进行对比分析</p>
              </div>
            </div>
            <div className="goal-item">
              <span className="goal-icon">💡</span>
              <div className="goal-content">
                <h4>学习建议</h4>
                <p>基于数据的学习建议和优化</p>
              </div>
            </div>
          </div>
        </div>

        {experienceLevel === 'beginner' && (
          <div className="tips-section">
            <h3>💡 如何开始</h3>
            <ul className="tips-list">
              <li>上传第一个音频文件开始学习</li>
              <li>坚持每天学习，建立学习习惯</li>
              <li>查看详细的转写和分析结果</li>
              <li>使用播放器的各种功能辅助学习</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsEmpty;