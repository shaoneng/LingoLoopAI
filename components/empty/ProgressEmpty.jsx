import React from 'react';

const ProgressEmpty = ({ context }) => {
  const { user, experienceLevel } = context;

  const handleStartLearning = () => {
    if (window.location) {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="empty-state progress-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="progress-icon">🚀</div>
        </div>

        <div className="empty-state-message">
          <h2>学习进度跟踪</h2>
          <p>开始学习后，这里将显示您的学习进度和成长轨迹</p>
        </div>

        <div className="empty-state-actions">
          <button
            className="primary-action"
            onClick={handleStartLearning}
          >
            <span className="action-icon">🎯</span>
            开始学习之旅
          </button>
        </div>

        <div className="progress-preview">
          <h3>📊 进度追踪功能：</h3>
          <div className="progress-features">
            <div className="feature-item">
              <div className="feature-icon">📈</div>
              <div className="feature-content">
                <h4>技能成长</h4>
                <p>听力、词汇、语法技能的成长曲线</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎯</div>
              <div className="feature-content">
                <h4>目标达成</h4>
                <p>学习目标的完成情况和进度</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <div className="feature-content">
                <h4>成就系统</h4>
                <p>解锁各种学习成就和徽章</p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📚</div>
              <div className="feature-content">
                <h4>学习报告</h4>
                <p>定期生成详细的学习报告</p>
              </div>
            </div>
          </div>
        </div>

        <div className="skill-tracking">
          <h3>🎓 技能发展跟踪</h3>
          <div className="skills-grid">
            <div className="skill-item">
              <div className="skill-icon">👂</div>
              <div className="skill-info">
                <h4>听力理解</h4>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: '0%' }}></div>
                </div>
                <p>通过不断练习提升听力水平</p>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-icon">📖</div>
              <div className="skill-info">
                <h4>词汇量</h4>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: '0%' }}></div>
                </div>
                <p>积累更多英语词汇和表达</p>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-icon">🔤</div>
              <div className="skill-info">
                <h4>语法理解</h4>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: '0%' }}></div>
                </div>
                <p>深入理解英语语法结构</p>
              </div>
            </div>
            <div className="skill-item">
              <div className="skill-icon">🗣️</div>
              <div className="skill-info">
                <h4>发音准确度</h4>
                <div className="skill-bar">
                  <div className="skill-progress" style={{ width: '0%' }}></div>
                </div>
                <p>通过对比分析改善发音</p>
              </div>
            </div>
          </div>
        </div>

        {experienceLevel === 'beginner' && (
          <div className="beginner-tips">
            <h3>💡 新手指南</h3>
            <div className="tips-content">
              <div className="tip-card">
                <div className="tip-icon">🎯</div>
                <div className="tip-text">
                  <h4>设定目标</h4>
                  <p>设定切实可行的学习目标</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📅</div>
                <div className="tip-text">
                  <h4>坚持学习</h4>
                  <p>养成每天学习的习惯</p>
                </div>
              </div>
              <div className="tip-card">
                <div className="tip-icon">📊</div>
                <div className="tip-text">
                  <h4>查看进度</h4>
                  <p>定期查看学习进度数据</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgressEmpty;