import React from 'react';

const StepCard = ({ number, title, description, icon, action, onAction }) => (
  <div className="step-card">
    <div className="step-number">{number}</div>
    <div className="step-content">
      <div className="step-icon">{icon}</div>
      <h3 className="step-title">{title}</h3>
      <p className="step-description">{description}</p>
      <button
        className="step-action"
        onClick={onAction}
      >
        {action}
      </button>
    </div>
  </div>
);

const SampleAudioCard = ({ title, description, duration, level, onClick }) => (
  <div className="sample-audio-card" onClick={onClick}>
    <div className="sample-audio-header">
      <div className="sample-audio-icon">🎵</div>
      <div className="sample-audio-info">
        <h4 className="sample-audio-title">{title}</h4>
        <div className="sample-audio-meta">
          <span className="duration">{duration}</span>
          <span className="level">{level}</span>
        </div>
      </div>
    </div>
    <p className="sample-audio-description">{description}</p>
    <div className="sample-audio-action">
      <span>立即体验</span>
      <span className="arrow">→</span>
    </div>
  </div>
);

const BeginnerDashboardEmpty = ({ context, onUpload, onTutorial, onLoadSample }) => {
  const { user, experienceLevel } = context;

  const handleUpload = () => {
    if (onUpload) {
      onUpload();
    } else {
      // Fallback: open upload modal if available
      if (window.openUploadModal) {
        window.openUploadModal();
      }
    }
  };

  const handleTutorial = (type) => {
    if (onTutorial) {
      onTutorial(type);
    } else {
      // Fallback: navigate to tutorial page
      if (window.location) {
        window.location.href = `/tutorial/${type}`;
      }
    }
  };

  const handleLoadSample = (sampleId) => {
    if (onLoadSample) {
      onLoadSample(sampleId);
    } else {
      // Fallback: navigate to demo page
      if (window.location) {
        window.location.href = `/demo/${sampleId}`;
      }
    }
  };

  return (
    <div className="empty-state beginner-dashboard-empty">
      <div className="empty-state-content">
        <div className="empty-state-illustration">
          <div className="welcome-animation">🎵</div>
        </div>

        <div className="empty-state-message">
          <h2>欢迎使用 LingoLoopAI！</h2>
          <p>让我们开始您的英语听力学习之旅</p>
          <div className="user-welcome">
            {user && (
              <span className="user-greeting">
                欢迎回来，{user.displayName || user.email}！
              </span>
            )}
          </div>
        </div>

        <div className="quick-start-guide">
          <h3>快速开始：</h3>
          <div className="steps">
            <StepCard
              number={1}
              title="上传音频"
              description="选择您想学习的英语音频文件"
              icon="📁"
              action="立即上传"
              onAction={handleUpload}
            />
            <StepCard
              number={2}
              title="智能转写"
              description="AI 将自动转写并分析您的音频"
              icon="🤖"
              action="了解转写"
              onAction={() => handleTutorial('transcription')}
            />
            <StepCard
              number={3}
              title="开始学习"
              description="使用丰富的工具提升您的听力"
              icon="📚"
              action="查看教程"
              onAction={() => handleTutorial('learning')}
            />
          </div>
        </div>

        <div className="sample-content">
          <h3>或尝试示例内容：</h3>
          <div className="sample-audios">
            <SampleAudioCard
              title="BBC 6 Minute English"
              description="短小精悍的英语学习节目"
              duration="6:00"
              level="中级"
              onClick={() => handleLoadSample('bbc-6-minute')}
            />
            <SampleAudioCard
              title="TED 演讲精选"
              description="富有启发性的英语演讲"
              duration="15:00"
              level="高级"
              onClick={() => handleLoadSample('ted-talk')}
            />
          </div>
        </div>

        <div className="feature-highlights">
          <h3>特色功能：</h3>
          <div className="highlights">
            <div className="highlight-item">
              <span className="highlight-icon">🎯</span>
              <span className="highlight-text">精准语音识别</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🧠</span>
              <span className="highlight-text">AI 智能分析</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">📊</span>
              <span className="highlight-text">学习进度跟踪</span>
            </div>
            <div className="highlight-item">
              <span className="highlight-icon">🎮</span>
              <span className="highlight-text">互动学习体验</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeginnerDashboardEmpty;