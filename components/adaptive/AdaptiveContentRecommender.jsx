import React, { useState, useEffect, useCallback } from 'react';
import { useAdaptiveExperience } from '../../hooks/useAdaptiveExperience';
import { useAnalytics } from '../../hooks/useAnalytics';

/**
 * Adaptive content recommendation system
 * Provides personalized content suggestions based on user behavior,
 * learning patterns, and performance data
 */
const AdaptiveContentRecommender = ({
  contentType = 'audio',
  maxRecommendations = 5,
  className = ''
}) => {
  const {
    experienceLevel,
    learningPattern,
    difficultyPreference,
    userProfile,
    getContentRecommendations,
    trackInteraction
  } = useAdaptiveExperience();

  const { trackEvent } = useAnalytics();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewHistory, setViewHistory] = useState([]);

  // Content categories for different types
  const contentCategories = {
    audio: [
      { id: 'beginner', name: '初级内容', difficulty: 'easy' },
      { id: 'intermediate', name: '中级内容', difficulty: 'medium' },
      { id: 'advanced', name: '高级内容', difficulty: 'hard' },
      { id: 'bbc', name: 'BBC资源', difficulty: 'mixed' },
      { id: 'pronunciation', name: '发音练习', difficulty: 'mixed' }
    ],
    practice: [
      { id: 'listening', name: '听力练习', type: 'listening' },
      { id: 'speaking', name: '口语练习', type: 'speaking' },
      { id: 'vocabulary', name: '词汇练习', type: 'vocabulary' },
      { id: 'grammar', name: '语法练习', type: 'grammar' }
    ],
    analysis: [
      { id: 'basic', name: '基础分析', complexity: 'low' },
      { id: 'detailed', name: '详细分析', complexity: 'medium' },
      { id: 'comparative', name: '对比分析', complexity: 'high' }
    ]
  };

  // Generate recommendations based on user profile
  const generateRecommendations = useCallback(() => {
    setLoading(true);

    // Get base recommendations from adaptive system
    const baseRecommendations = getContentRecommendations(contentType);

    // Generate personalized recommendations
    const personalizedRecommendations = generatePersonalizedRecommendations();

    // Combine and sort recommendations
    const allRecommendations = [
      ...baseRecommendations,
      ...personalizedRecommendations
    ];

    // Sort by priority and relevance
    const sortedRecommendations = allRecommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      })
      .slice(0, maxRecommendations);

    setRecommendations(sortedRecommendations);
    setLoading(false);
  }, [contentType, experienceLevel, learningPattern, difficultyPreference, userProfile, getContentRecommendations, maxRecommendations]);

  // Generate personalized recommendations based on user data
  const generatePersonalizedRecommendations = () => {
    const recs = [];

    // Experience-based recommendations
    switch (experienceLevel.id) {
      case 'beginner':
        recs.push({
          id: 'beginner_guide',
          type: 'guide',
          title: '新手入门指南',
          description: '了解如何使用LingoLoopAI进行英语学习',
          priority: 'high',
          category: 'learning',
          difficulty: 'easy',
          estimatedTime: '5分钟',
          learningPattern: 'visual',
          tags: ['新手', '指导', '基础']
        });
        break;

      case 'intermediate':
        recs.push({
          id: 'skill_building',
          type: 'practice',
          title: '技能提升练习',
          description: '针对您的学习模式定制的练习内容',
          priority: 'medium',
          category: 'practice',
          difficulty: 'medium',
          estimatedTime: '15分钟',
          learningPattern: learningPattern?.id,
          tags: ['中级', '技能', '练习']
        });
        break;

      case 'advanced':
        recs.push({
          id: 'advanced_techniques',
          type: 'technique',
          title: '高级学习技巧',
          description: '掌握高效的学习方法和技巧',
          priority: 'medium',
          category: 'technique',
          difficulty: 'hard',
          estimatedTime: '20分钟',
          learningPattern: learningPattern?.id,
          tags: ['高级', '技巧', '效率']
        });
        break;

      case 'expert':
        recs.push({
          id: 'customization',
          type: 'custom',
          title: '个性化定制',
          description: '根据您的需求定制学习方案',
          priority: 'low',
          category: 'custom',
          difficulty: 'expert',
          estimatedTime: '30分钟',
          learningPattern: learningPattern?.id,
          tags: ['专家', '定制', '个性化']
        });
        break;
    }

    // Learning pattern-based recommendations
    if (learningPattern) {
      switch (learningPattern.id) {
        case 'visual':
          recs.push({
            id: 'visual_content',
            type: 'content',
            title: '视觉化学习内容',
            description: '图表和可视化内容帮助理解',
            priority: 'medium',
            category: 'content',
            difficulty: difficultyPreference.id,
            estimatedTime: '10分钟',
            learningPattern: 'visual',
            tags: ['视觉', '图表', '可视化']
          });
          break;

        case 'auditory':
          recs.push({
            id: 'audio_content',
            type: 'content',
            title: '听力强化训练',
            description: '专注于听力理解和发音',
            priority: 'medium',
            category: 'content',
            difficulty: difficultyPreference.id,
            estimatedTime: '15分钟',
            learningPattern: 'auditory',
            tags: ['听觉', '听力', '发音']
          });
          break;

        case 'kinesthetic':
          recs.push({
            id: 'interactive_practice',
            type: 'practice',
            title: '互动式练习',
            description: '通过实际操作巩固学习成果',
            priority: 'medium',
            category: 'practice',
            difficulty: difficultyPreference.id,
            estimatedTime: '12分钟',
            learningPattern: 'kinesthetic',
            tags: ['互动', '操作', '实践']
          });
          break;

        case 'analytical':
          recs.push({
            id: 'analytical_tools',
            type: 'tool',
            title: '深度分析工具',
            description: '使用分析工具深入理解语言结构',
            priority: 'medium',
            category: 'tool',
            difficulty: difficultyPreference.id,
            estimatedTime: '18分钟',
            learningPattern: 'analytical',
            tags: ['分析', '工具', '深度']
          });
          break;
      }
    }

    // Performance-based recommendations
    if (userProfile?.recentPerformance) {
      const { completionRate, accuracy, frustrationSignals } = userProfile.recentPerformance;

      if (frustrationSignals > 0.5) {
        recs.push({
          id: 'difficulty_adjustment',
          type: 'adjustment',
          title: '调整学习难度',
          description: '根据您的表现调整内容难度',
          priority: 'high',
          category: 'adjustment',
          difficulty: 'adaptive',
          estimatedTime: '5分钟',
          tags: ['调整', '难度', '优化']
        });
      }

      if (accuracy < 0.6) {
        recs.push({
          id: 'accuracy_improvement',
          type: 'improvement',
          title: '准确度提升',
          description: '针对性练习提高准确度',
          priority: 'high',
          category: 'improvement',
          difficulty: 'adaptive',
          estimatedTime: '20分钟',
          tags: ['准确度', '提升', '练习']
        });
      }

      if (completionRate < 0.7) {
        recs.push({
          id: 'completion_focus',
          type: 'focus',
          title: '完成度提升',
          description: '提高学习任务完成率',
          priority: 'medium',
          category: 'focus',
          difficulty: 'adaptive',
          estimatedTime: '15分钟',
          tags: ['完成度', '专注', '效率']
        });
      }
    }

    // Content type specific recommendations
    switch (contentType) {
      case 'audio':
        recs.push({
          id: 'audio_processing',
          type: 'feature',
          title: '音频处理技巧',
          description: '学习如何高效处理音频文件',
          priority: 'medium',
          category: 'feature',
          difficulty: 'medium',
          estimatedTime: '8分钟',
          tags: ['音频', '处理', '技巧']
        });
        break;

      case 'practice':
        recs.push({
          id: 'practice_methods',
          type: 'method',
          title: '练习方法指南',
          description: '有效的练习方法和技巧',
          priority: 'medium',
          category: 'method',
          difficulty: 'medium',
          estimatedTime: '12分钟',
          tags: ['练习', '方法', '技巧']
        });
        break;

      case 'analysis':
        recs.push({
          id: 'analysis_techniques',
          type: 'technique',
          title: '分析技术',
          description: '掌握语言分析的高级技术',
          priority: 'medium',
          category: 'technique',
          difficulty: 'hard',
          estimatedTime: '25分钟',
          tags: ['分析', '技术', '高级']
        });
        break;
    }

    return recs;
  };

  // Filter recommendations by category
  const filteredRecommendations = recommendations.filter(rec => {
    if (selectedCategory === 'all') return true;
    return rec.category === selectedCategory;
  });

  // Handle recommendation click
  const handleRecommendationClick = (recommendation) => {
    trackInteraction('recommendation_clicked', {
      recommendation_id: recommendation.id,
      recommendation_type: recommendation.type,
      priority: recommendation.priority,
      experience_level: experienceLevel.id
    });

    trackEvent('content_recommendation_engaged', {
      content_id: recommendation.id,
      content_type: recommendation.type,
      user_level: experienceLevel.id,
      learning_pattern: learningPattern?.id
    });

    // Add to view history
    setViewHistory(prev => [...prev, {
      ...recommendation,
      viewedAt: Date.now()
    }]);

    // Handle recommendation action
    handleRecommendationAction(recommendation);
  };

  // Handle recommendation action
  const handleRecommendationAction = (recommendation) => {
    switch (recommendation.type) {
      case 'guide':
        console.log('Opening guide:', recommendation.title);
        break;
      case 'practice':
        console.log('Starting practice:', recommendation.title);
        break;
      case 'content':
        console.log('Loading content:', recommendation.title);
        break;
      case 'tool':
        console.log('Opening tool:', recommendation.title);
        break;
      case 'feature':
        console.log('Showing feature:', recommendation.title);
        break;
      default:
        console.log('Handling recommendation:', recommendation.title);
    }
  };

  // Get recommendation priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Get difficulty indicator
  const getDifficultyIndicator = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return { text: '简单', color: 'text-green-600', icon: '🟢' };
      case 'medium':
        return { text: '中等', color: 'text-yellow-600', icon: '🟡' };
      case 'hard':
        return { text: '困难', color: 'text-red-600', icon: '🔴' };
      case 'expert':
        return { text: '专家', color: 'text-purple-600', icon: '🟣' };
      default:
        return { text: '自适应', color: 'text-blue-600', icon: '🔵' };
    }
  };

  // Initialize recommendations
  useEffect(() => {
    generateRecommendations();
  }, [generateRecommendations]);

  // Auto-refresh recommendations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      generateRecommendations();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(interval);
  }, [generateRecommendations]);

  if (loading) {
    return (
      <div className={`adaptive-recommender loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner">⏳</div>
          <p>正在为您生成个性化推荐...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`adaptive-recommender ${className}`}>
      <div className="recommender-header">
        <h3 className="recommender-title">
          为您推荐
          <span className="experience-level-badge">{experienceLevel.name}</span>
        </h3>
        <div className="recommender-controls">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="category-filter"
          >
            <option value="all">全部类别</option>
            <option value="learning">学习</option>
            <option value="practice">练习</option>
            <option value="content">内容</option>
            <option value="tool">工具</option>
            <option value="technique">技巧</option>
          </select>
          <button
            onClick={generateRecommendations}
            className="refresh-btn"
            title="刷新推荐"
          >
            🔄
          </button>
        </div>
      </div>

      <div className="recommendations-grid">
        {filteredRecommendations.map((recommendation) => {
          const difficulty = getDifficultyIndicator(recommendation.difficulty);
          const priorityColor = getPriorityColor(recommendation.priority);

          return (
            <div
              key={recommendation.id}
              className={`recommendation-card ${priorityColor}`}
              onClick={() => handleRecommendationClick(recommendation)}
            >
              <div className="card-header">
                <div className="card-title-section">
                  <h4 className="card-title">{recommendation.title}</h4>
                  <div className="card-meta">
                    <span className="priority-badge">{recommendation.priority}</span>
                    <span className={`difficulty-indicator ${difficulty.color}`}>
                      {difficulty.icon} {difficulty.text}
                    </span>
                    <span className="estimated-time">⏱️ {recommendation.estimatedTime}</span>
                  </div>
                </div>
                <div className="card-learning-pattern">
                  {recommendation.learningPattern && (
                    <span className="learning-pattern-badge">
                      {recommendation.learningPattern === 'visual' && '👁️ 视觉'}
                      {recommendation.learningPattern === 'auditory' && '👂 听觉'}
                      {recommendation.learningPattern === 'kinesthetic' && '🤲 动觉'}
                      {recommendation.learningPattern === 'analytical' && '🧠 分析'}
                    </span>
                  )}
                </div>
              </div>

              <div className="card-content">
                <p className="card-description">{recommendation.description}</p>
                <div className="card-tags">
                  {recommendation.tags?.map((tag, index) => (
                    <span key={index} className="tag">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-footer">
                <button className="action-btn primary">
                  {recommendation.type === 'guide' && '开始学习'}
                  {recommendation.type === 'practice' && '开始练习'}
                  {recommendation.type === 'content' && '查看内容'}
                  {recommendation.type === 'tool' && '使用工具'}
                  {recommendation.type === 'technique' && '学习技巧'}
                  {recommendation.type === 'feature' && '了解功能'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRecommendations.length === 0 && (
        <div className="no-recommendations">
          <div className="empty-state">
            <span className="empty-icon">🔍</span>
            <h4>暂无推荐内容</h4>
            <p>请尝试选择其他类别或稍后再试</p>
          </div>
        </div>
      )}

      <style jsx>{`
        .adaptive-recommender {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .recommender-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .recommender-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .experience-level-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        .recommender-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .category-filter {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: white;
          font-size: 0.875rem;
        }

        .refresh-btn {
          padding: 0.5rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .refresh-btn:hover {
          background: #e5e7eb;
        }

        .recommendations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .recommendation-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .recommendation-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .card-title-section {
          flex: 1;
        }

        .card-title {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .card-meta {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
          align-items: center;
        }

        .priority-badge {
          padding: 0.125rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .difficulty-indicator {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .estimated-time {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .learning-pattern-badge {
          padding: 0.125rem 0.5rem;
          background: #f3f4f6;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .card-content {
          margin-bottom: 1rem;
        }

        .card-description {
          margin: 0 0 0.75rem 0;
          font-size: 0.875rem;
          color: #4b5563;
          line-height: 1.5;
        }

        .card-tags {
          display: flex;
          gap: 0.25rem;
          flex-wrap: wrap;
        }

        .tag {
          font-size: 0.75rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 0.125rem 0.375rem;
          border-radius: 4px;
        }

        .card-footer {
          display: flex;
          justify-content: flex-end;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .action-btn.primary {
          background: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2563eb;
        }

        .no-recommendations {
          text-align: center;
          padding: 3rem;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .empty-icon {
          font-size: 3rem;
        }

        .loading-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          padding: 3rem;
        }

        .loading-spinner {
          font-size: 2rem;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .recommender-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .recommendations-grid {
            grid-template-columns: 1fr;
          }

          .card-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveContentRecommender;