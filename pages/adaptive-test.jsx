import React, { useState, useEffect } from 'react';
import { useAdaptiveExperience } from '../hooks/useAdaptiveExperience';
import { useAnalytics } from '../hooks/useAnalytics';
import dynamic from 'next/dynamic';

// 动态导入组件以避免服务器端渲染问题
const AdaptiveContainer = dynamic(() => import('../components/adaptive/AdaptiveContainer'), { ssr: false });
const AdaptiveNavigation = dynamic(() => import('../components/adaptive/AdaptiveNavigation'), { ssr: false });
const AdaptiveContentRecommender = dynamic(() => import('../components/adaptive/AdaptiveContentRecommender'), { ssr: false });
const AdaptiveForm = dynamic(() => import('../components/adaptive/AdaptiveForm'), { ssr: false });
const AdaptiveTestRunner = dynamic(() => import('../components/adaptive/AdaptiveTestRunner'), { ssr: false });

/**
 * Adaptive Experience System Test Page
 * Provides comprehensive testing and demonstration of adaptive features
 */
const AdaptiveTestPage = () => {
  const {
    experienceLevel,
    learningPattern,
    difficultyPreference,
    adaptations,
    userProfile,
    getContentRecommendations,
    getAdaptiveUI,
    shouldShowFeatureDiscovery,
    markFeatureDiscovered,
    getPersonalizedHelp,
    updateUserProfile,
    trackInteraction
  } = useAdaptiveExperience();

  const { trackEvent } = useAnalytics();

  const [activeTab, setActiveTab] = useState('demo');
  const [simulationData, setSimulationData] = useState(null);
  const [interactionCount, setInteractionCount] = useState(0);

  // Demo form fields
  const demoFormFields = {
    username: {
      label: '用户名',
      type: 'text',
      placeholder: '请输入用户名',
      required: true,
      importance: 'high',
      help: '用于登录和个性化体验的用户名'
    },
    email: {
      label: '邮箱',
      type: 'email',
      placeholder: '请输入邮箱地址',
      required: true,
      importance: 'high',
      help: '用于账户验证和通知'
    },
    experience: {
      label: '英语水平',
      type: 'select',
      placeholder: '选择您的英语水平',
      required: true,
      importance: 'medium',
      options: [
        { value: 'beginner', label: '初学者' },
        { value: 'intermediate', label: '中级' },
        { value: 'advanced', label: '高级' },
        { value: 'native', label: '母语水平' }
      ]
    },
    interests: {
      label: '学习兴趣',
      type: 'textarea',
      placeholder: '描述您的英语学习兴趣和目标',
      required: false,
      importance: 'low',
      rows: 3,
      help: '帮助我们为您推荐更合适的学习内容'
    },
    newsletter: {
      label: '订阅学习资讯',
      type: 'checkbox',
      required: false,
      importance: 'low',
      help: '接收学习技巧和更新资讯'
    }
  };

  // Initialize simulation data
  useEffect(() => {
    // Track page view
    trackEvent('adaptive_test_page_viewed', {
      experience_level: experienceLevel?.id,
      learning_pattern: learningPattern?.id
    });

    // Generate simulation data
    const simulation = {
      userProgress: {
        sessionsCompleted: Math.floor(Math.random() * 50) + 1,
        hoursSpent: Math.floor(Math.random() * 30) + 0.5,
        accuracy: Math.random() * 0.4 + 0.6, // 0.6 - 1.0
        completionRate: Math.random() * 0.3 + 0.7 // 0.7 - 1.0
      },
      behaviorMetrics: {
        visualInteractions: Math.floor(Math.random() * 50) + 10,
        audioUsage: Math.floor(Math.random() * 40) + 5,
        interactiveUsage: Math.floor(Math.random() * 30) + 5,
        analyticalFeatures: Math.floor(Math.random() * 20) + 2
      }
    };

    setSimulationData(simulation);
  }, [experienceLevel, learningPattern, trackEvent]);

  // Handle user interaction
  const handleInteraction = (type, context = {}) => {
    setInteractionCount(prev => prev + 1);
    trackInteraction(type, {
      ...context,
      interaction_count: interactionCount + 1
    });
  };

  // Simulate user progression
  const simulateProgression = () => {
    if (!simulationData) return;

    const updatedProgress = {
      ...simulationData.userProgress,
      sessionsCompleted: simulationData.userProgress.sessionsCompleted + 1,
      hoursSpent: simulationData.userProgress.hoursSpent + 0.5,
      accuracy: Math.min(1, simulationData.userProgress.accuracy + 0.05),
      completionRate: Math.min(1, simulationData.userProgress.completionRate + 0.03)
    };

    const updatedBehavior = {
      ...simulationData.behaviorMetrics,
      visualInteractions: simulationData.behaviorMetrics.visualInteractions + 2,
      audioUsage: simulationData.behaviorMetrics.audioUsage + 1,
      interactiveUsage: simulationData.behaviorMetrics.interactiveUsage + 3,
      analyticalFeatures: simulationData.behaviorMetrics.analyticalFeatures + 1
    };

    const updatedSimulation = {
      ...simulationData,
      userProgress: updatedProgress,
      behaviorMetrics: updatedBehavior
    };

    setSimulationData(updatedSimulation);

    // Update user profile
    updateUserProfile({
      stats: {
        sessionCount: updatedProgress.sessionsCompleted,
        totalHours: updatedProgress.hoursSpent,
        completedAnalyses: Math.floor(updatedProgress.sessionsCompleted * 2),
        avgAccuracy: updatedProgress.accuracy
      },
      behaviorData: updatedBehavior,
      performanceData: {
        completionRate: updatedProgress.completionRate,
        accuracy: updatedProgress.accuracy,
        timeSpent: updatedProgress.hoursSpent * 60,
        frustrationSignals: 1 - updatedProgress.accuracy
      }
    });

    handleInteraction('progression_simulation', {
      sessions_completed: updatedProgress.sessionsCompleted,
      accuracy_improvement: 0.05
    });
  };

  // Get adaptive UI configuration
  const uiConfig = getAdaptiveUI();

  // Get content recommendations
  const recommendations = getContentRecommendations();

  // Render demo content
  const renderDemoContent = () => (
    <div className="demo-content">
      <div className="adaptive-info-panel">
        <h3>当前用户配置</h3>
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">经验等级:</span>
            <span className="info-value">{experienceLevel?.name || '加载中...'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">学习模式:</span>
            <span className="info-value">{learningPattern?.name || '检测中...'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">难度偏好:</span>
            <span className="info-value">{difficultyPreference?.name || '自适应'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">界面密度:</span>
            <span className="info-value">{uiConfig?.configuration?.density || '标准'}</span>
          </div>
        </div>

        <div className="adaptations-list">
          <h4>当前适配:</h4>
          <div className="adaptations-grid">
            {Object.entries(adaptations).map(([key, value]) => (
              <div key={key} className={`adaptation-item ${value ? 'active' : 'inactive'}`}>
                <span className="adaptation-status">{value ? '✅' : '❌'}</span>
                <span className="adaptation-name">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="simulation-panel">
        <h3>用户行为模拟</h3>
        {simulationData && (
          <div className="simulation-stats">
            <div className="stat-item">
              <span className="stat-label">完成会话:</span>
              <span className="stat-value">{simulationData.userProgress.sessionsCompleted}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">学习时长:</span>
              <span className="stat-value">{simulationData.userProgress.hoursSpent.toFixed(1)}小时</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">准确率:</span>
              <span className="stat-value">{(simulationData.userProgress.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">完成率:</span>
              <span className="stat-value">{(simulationData.userProgress.completionRate * 100).toFixed(1)}%</span>
            </div>
          </div>
        )}
        <button
          onClick={simulateProgression}
          className="simulate-btn"
        >
          模拟学习进度
        </button>
      </div>

      <div className="interaction-demo">
        <h3>交互测试</h3>
        <div className="interaction-buttons">
          <button
            onClick={() => handleInteraction('visual_focus')}
            className="interaction-btn visual"
          >
            👁️ 视觉交互
          </button>
          <button
            onClick={() => handleInteraction('audio_play')}
            className="interaction-btn auditory"
          >
            👂 听觉交互
          </button>
          <button
            onClick={() => handleInteraction('interactive_element')}
            className="interaction-btn kinesthetic"
          >
            🤲 互动交互
          </button>
          <button
            onClick={() => handleInteraction('analytical_feature')}
            className="interaction-btn analytical"
          >
            🧠 分析交互
          </button>
        </div>
        <p className="interaction-count">
          总交互次数: {interactionCount}
        </p>
      </div>

      <div className="adaptive-components-demo">
        <h3>自适应组件演示</h3>

        <AdaptiveContainer
          featureId="demo_container"
          helpContext="演示自适应容器功能"
          className="demo-container"
        >
          <h4>自适应容器</h4>
          <p>这个容器会根据您的经验等级调整显示内容和帮助级别。</p>
          <p>当前等级: {experienceLevel?.name}</p>
          <button
            onClick={() => markFeatureDiscovered('demo_container')}
            className="demo-btn"
          >
            标记为已发现
          </button>
        </AdaptiveContainer>

        <div className="demo-form-section">
          <h4>自适应表单</h4>
          <AdaptiveForm
            fields={demoFormFields}
            onSubmit={(values) => {
              console.log('表单提交:', values);
              handleInteraction('form_submit', { form_fields: Object.keys(values) });
            }}
            submitText="提交表单"
            className="demo-form"
          />
        </div>

        <div className="demo-recommendations">
          <h4>个性化推荐</h4>
          <AdaptiveContentRecommender
            contentType="audio"
            maxRecommendations={3}
            className="demo-recommender"
          />
        </div>
      </div>
    </div>
  );

  // Render documentation
  const renderDocumentation = () => (
    <div className="documentation">
      <h3>自适应用户体验系统文档</h3>

      <div className="doc-section">
        <h4>系统概述</h4>
        <p>LingoLoopAI的自适应用户体验系统通过分析用户行为、技能水平和学习模式，为每个用户提供个性化的学习体验。系统能够自动调整界面复杂度、内容难度、功能发现顺序等，确保用户始终获得最适合的学习环境。</p>
      </div>

      <div className="doc-section">
        <h4>核心功能</h4>
        <ul className="feature-list">
          <li><strong>智能用户画像:</strong> 基于使用数据自动识别用户经验等级和学习模式</li>
          <li><strong>动态界面适配:</strong> 根据用户水平调整导航、表单、内容的复杂度</li>
          <li><strong>个性化推荐:</strong> 基于学习模式和表现推荐最适合的学习内容</li>
          <li><strong>渐进式功能发现:</strong> 按照用户的学习进度逐步展示高级功能</li>
          <li><strong>智能帮助系统:</strong> 在需要时提供上下文相关的帮助和指导</li>
        </ul>
      </div>

      <div className="doc-section">
        <h4>经验等级</h4>
        <div className="level-grid">
          <div className="level-card beginner">
            <h5>初学者</h5>
            <p>刚开始使用，需要更多指导和简化界面</p>
            <ul>
              <li>引导式学习</li>
              <li>简化界面</li>
              <li>增强帮助</li>
              <li>基本功能</li>
            </ul>
          </div>
          <div className="level-card intermediate">
            <h5>中级用户</h5>
            <p>有一定经验，探索更多功能</p>
            <ul>
              <li>平衡界面</li>
              <li>上下文帮助</li>
              <li>高级提示</li>
              <li>渐进披露</li>
            </ul>
          </div>
          <div className="level-card advanced">
            <h5>高级用户</h5>
            <p>熟练使用，追求效率</p>
            <ul>
              <li>紧凑界面</li>
              <li>高效导航</li>
              <li>高级功能</li>
              <li>键盘快捷键</li>
            </ul>
          </div>
          <div className="level-card expert">
            <h5>专家用户</h5>
            <p>深度使用，追求定制化</p>
            <ul>
              <li>极简界面</li>
              <li>键盘导航</li>
              <li>完全定制</li>
              <li>测试功能</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="doc-section">
        <h4>学习模式</h4>
        <div className="pattern-grid">
          <div className="pattern-card visual">
            <h5>👁️ 视觉型</h5>
            <p>通过图表、图像和可视化内容学习效果最佳</p>
          </div>
          <div className="pattern-card auditory">
            <h5>👂 听觉型</h5>
            <p>通过音频、语音和听力练习学习效果最佳</p>
          </div>
          <div className="pattern-card kinesthetic">
            <h5>🤲 动觉型</h5>
            <p>通过实际操作和互动练习学习效果最佳</p>
          </div>
          <div className="pattern-card analytical">
            <h5>🧠 分析型</h5>
            <p>通过数据分析和详细解释学习效果最佳</p>
          </div>
        </div>
      </div>

      <div className="doc-section">
        <h4>技术实现</h4>
        <p>系统基于React Hooks架构，使用CSS变量实现动态样式调整，支持完整的响应式设计和无障碍功能。所有适配逻辑都在客户端实时计算，确保即时响应用户行为变化。</p>
      </div>
    </div>
  );

  return (
    <div className="adaptive-test-page">
      <AdaptiveNavigation />

      <div className="page-header">
        <h1>🧪 自适应系统测试</h1>
        <p>测试和体验LingoLoopAI的自适应用户体验系统</p>
      </div>

      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'demo' ? 'active' : ''}`}
          onClick={() => setActiveTab('demo')}
        >
          功能演示
        </button>
        <button
          className={`tab-btn ${activeTab === 'testing' ? 'active' : ''}`}
          onClick={() => setActiveTab('testing')}
        >
          系统测试
        </button>
        <button
          className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`}
          onClick={() => setActiveTab('docs')}
        >
          系统文档
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'demo' && renderDemoContent()}
        {activeTab === 'testing' && <AdaptiveTestRunner />}
        {activeTab === 'docs' && renderDocumentation()}
      </div>

      <style jsx global>{`
        body {
          background: #f8fafc;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
      `}</style>

      <style jsx>{`
        .adaptive-test-page {
          min-height: 100vh;
          background: #f8fafc;
        }

        .page-header {
          background: white;
          padding: 2rem;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .page-header h1 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
        }

        .page-header p {
          margin: 0;
          color: #6b7280;
        }

        .tab-navigation {
          display: flex;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          padding: 0 2rem;
        }

        .tab-btn {
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .demo-content {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .adaptive-info-panel,
        .simulation-panel,
        .interaction-demo {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .adaptive-info-panel h3,
        .simulation-panel h3,
        .interaction-demo h3 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .info-grid {
          display: grid;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .info-label {
          font-weight: 500;
          color: #6b7280;
        }

        .info-value {
          font-weight: 600;
          color: #1f2937;
        }

        .adaptations-list h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .adaptations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 0.5rem;
        }

        .adaptation-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 0.875rem;
        }

        .adaptation-item.active {
          background: #f0fdf4;
          color: #059669;
        }

        .adaptation-item.inactive {
          background: #fef2f2;
          color: #dc2626;
        }

        .simulation-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: #f8fafc;
          border-radius: 6px;
        }

        .stat-label {
          font-weight: 500;
          color: #6b7280;
        }

        .stat-value {
          font-weight: 600;
          color: #1f2937;
        }

        .simulate-btn {
          width: 100%;
          padding: 0.75rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .simulate-btn:hover {
          background: #2563eb;
        }

        .interaction-buttons {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .interaction-btn {
          padding: 1rem;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .interaction-btn:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        .interaction-btn.visual:hover {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .interaction-btn.auditory:hover {
          border-color: #10b981;
          background: #d1fae5;
        }

        .interaction-btn.kinesthetic:hover {
          border-color: #f59e0b;
          background: #fef3c7;
        }

        .interaction-btn.analytical:hover {
          border-color: #8b5cf6;
          background: #ede9fe;
        }

        .interaction-count {
          text-align: center;
          color: #6b7280;
          font-size: 0.875rem;
        }

        .adaptive-components-demo {
          grid-column: 1 / -1;
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .adaptive-components-demo h3 {
          margin: 0 0 1.5rem 0;
          color: #374151;
        }

        .demo-container,
        .demo-form-section,
        .demo-recommendations {
          margin-bottom: 2rem;
        }

        .demo-btn {
          padding: 0.5rem 1rem;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 1rem;
        }

        .demo-btn:hover {
          background: #059669;
        }

        .documentation {
          background: white;
          border-radius: 12px;
          padding: 2rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .documentation h3 {
          margin: 0 0 2rem 0;
          color: #1f2937;
          text-align: center;
        }

        .doc-section {
          margin-bottom: 3rem;
        }

        .doc-section h4 {
          margin: 0 0 1rem 0;
          color: #374151;
        }

        .doc-section p {
          margin: 0 0 1rem 0;
          color: #4b5563;
          line-height: 1.6;
        }

        .feature-list {
          margin: 0;
          padding-left: 1.5rem;
        }

        .feature-list li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        .level-grid,
        .pattern-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        .level-card,
        .pattern-card {
          background: #f8fafc;
          border-radius: 8px;
          padding: 1.5rem;
          border: 1px solid #e5e7eb;
        }

        .level-card h5,
        .pattern-card h5 {
          margin: 0 0 0.75rem 0;
          color: #374151;
        }

        .level-card p,
        .pattern-card p {
          margin: 0 0 1rem 0;
          color: #6b7280;
        }

        .level-card ul,
        .pattern-card ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .level-card li,
        .pattern-card li {
          margin-bottom: 0.25rem;
          color: #4b5563;
        }

        .level-card.beginner {
          border-left: 4px solid #3b82f6;
        }

        .level-card.intermediate {
          border-left: 4px solid #10b981;
        }

        .level-card.advanced {
          border-left: 4px solid #f59e0b;
        }

        .level-card.expert {
          border-left: 4px solid #8b5cf6;
        }

        .pattern-card.visual {
          border-left: 4px solid #3b82f6;
        }

        .pattern-card.auditory {
          border-left: 4px solid #10b981;
        }

        .pattern-card.kinesthetic {
          border-left: 4px solid #f59e0b;
        }

        .pattern-card.analytical {
          border-left: 4px solid #8b5cf6;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .tab-navigation {
            padding: 0 1rem;
            overflow-x: auto;
          }

          .tab-btn {
            padding: 0.75rem 1rem;
            white-space: nowrap;
          }

          .tab-content {
            padding: 1rem;
          }

          .demo-content {
            grid-template-columns: 1fr;
          }

          .simulation-stats {
            grid-template-columns: 1fr;
          }

          .interaction-buttons {
            grid-template-columns: 1fr;
          }

          .level-grid,
          .pattern-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveTestPage;