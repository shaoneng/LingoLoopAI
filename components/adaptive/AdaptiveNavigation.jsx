import React, { useState } from 'react';
import { useAdaptiveExperience } from '../../hooks/useAdaptiveExperience';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Adaptive navigation that adjusts based on user experience level
 * Provides different navigation patterns for different user types
 */
const AdaptiveNavigation = () => {
  const { user } = useAuth();
  const {
    experienceLevel,
    adaptations,
    getAdaptiveUI,
    trackInteraction,
    getContentRecommendations
  } = useAdaptiveExperience();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('main');

  const uiConfig = getAdaptiveUI();

  // Get navigation items based on experience level
  const getNavigationItems = () => {
    const baseItems = [
      { id: 'dashboard', label: '主页', icon: '🏠', path: '/' },
      { id: 'upload', label: '上传', icon: '📤', path: '/upload' },
      { id: 'library', label: '音频库', icon: '📚', path: '/library' }
    ];

    switch (experienceLevel.id) {
      case 'beginner':
        return [
          ...baseItems,
          { id: 'help', label: '帮助', icon: '❓', path: '/help', highlight: true }
        ];

      case 'intermediate':
        return [
          ...baseItems,
          { id: 'stats', label: '统计', icon: '📊', path: '/stats' },
          { id: 'progress', label: '进度', icon: '📈', path: '/progress' }
        ];

      case 'advanced':
        return [
          ...baseItems,
          { id: 'stats', label: '统计', icon: '📊', path: '/stats' },
          { id: 'progress', label: '进度', icon: '📈', path: '/progress' },
          { id: 'settings', label: '设置', icon: '⚙️', path: '/settings' },
          { id: 'advanced', label: '高级', icon: '🔧', path: '/advanced' }
        ];

      case 'expert':
        return [
          ...baseItems,
          { id: 'stats', label: '统计', icon: '📊', path: '/stats' },
          { id: 'progress', label: '进度', icon: '📈', path: '/progress' },
          { id: 'settings', label: '设置', icon: '⚙️', path: '/settings' },
          { id: 'advanced', label: '高级', icon: '🔧', path: '/advanced' },
          { id: 'tools', label: '工具', icon: '🛠️', path: '/tools' },
          { id: 'api', label: 'API', icon: '🔌', path: '/api' }
        ];

      default:
        return baseItems;
    }
  };

  // Get quick actions based on experience level
  const getQuickActions = () => {
    const recommendations = getContentRecommendations();

    switch (experienceLevel.id) {
      case 'beginner':
        return [
          { id: 'tour', label: '新手引导', icon: '🎯', action: 'start_tour' },
          { id: 'upload', label: '上传音频', icon: '📤', action: 'upload' },
          { id: 'help', label: '获取帮助', icon: '❓', action: 'show_help' }
        ];

      case 'intermediate':
        return [
          { id: 'upload', label: '上传音频', icon: '📤', action: 'upload' },
          { id: 'recent', label: '最近项目', icon: '🕐', action: 'show_recent' },
          { id: 'stats', label: '查看统计', icon: '📊', action: 'show_stats' }
        ];

      case 'advanced':
        return [
          { id: 'upload', label: '上传', icon: '📤', action: 'upload' },
          { id: 'batch', label: '批量处理', icon: '📋', action: 'batch_process' },
          { id: 'export', label: '导出', icon: '📥', action: 'export' }
        ];

      case 'expert':
        return [
          { id: 'shortcuts', label: '快捷键', icon: '⌨️', action: 'show_shortcuts' },
          { id: 'upload', label: '上传', icon: '📤', action: 'upload' },
          { id: 'settings', label: '设置', icon: '⚙️', action: 'settings' }
        ];

      default:
        return [];
    }
  };

  // Handle navigation click
  const handleNavClick = (item) => {
    trackInteraction('navigation_click', {
      item_id: item.id,
      experience_level: experienceLevel.id
    });

    if (item.action) {
      handleQuickAction(item.action);
    } else if (item.path) {
      // Navigate to path (would use router in real app)
      console.log(`Navigate to: ${item.path}`);
    }
  };

  // Handle quick action
  const handleQuickAction = (action) => {
    trackInteraction('quick_action', {
      action,
      experience_level: experienceLevel.id
    });

    switch (action) {
      case 'start_tour':
        // Start guided tour
        console.log('Starting guided tour');
        break;
      case 'upload':
        // Open upload modal
        console.log('Opening upload modal');
        break;
      case 'show_help':
        // Show help section
        console.log('Showing help');
        break;
      case 'show_recent':
        // Show recent items
        console.log('Showing recent items');
        break;
      case 'show_stats':
        // Show statistics
        console.log('Showing statistics');
        break;
      case 'batch_process':
        // Start batch processing
        console.log('Starting batch processing');
        break;
      case 'export':
        // Export functionality
        console.log('Export functionality');
        break;
      case 'show_shortcuts':
        // Show keyboard shortcuts
        console.log('Showing shortcuts');
        break;
      case 'settings':
        // Open settings
        console.log('Opening settings');
        break;
    }
  };

  // Render navigation layout based on experience level
  const renderNavigation = () => {
    const navItems = getNavigationItems();
    const quickActions = getQuickActions();

    switch (uiConfig.configuration.navigation) {
      case 'basic':
        return renderBasicNavigation(navItems, quickActions);
      case 'enhanced':
        return renderEnhancedNavigation(navItems, quickActions);
      case 'efficient':
        return renderEfficientNavigation(navItems, quickActions);
      case 'keyboard':
        return renderKeyboardNavigation(navItems, quickActions);
      default:
        return renderBasicNavigation(navItems, quickActions);
    }
  };

  // Basic navigation for beginners
  const renderBasicNavigation = (navItems, quickActions) => (
    <nav className="adaptive-nav basic-nav">
      <div className="nav-header">
        <h1 className="nav-title">LingoLoopAI</h1>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="menu-toggle"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {isMenuOpen && (
        <div className="nav-content">
          <div className="nav-sections">
            <div className="nav-section">
              <h3 className="section-title">主要功能</h3>
              <ul className="nav-list">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item)}
                      className={`nav-item ${item.highlight ? 'highlight' : ''}`}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="nav-section">
              <h3 className="section-title">快速操作</h3>
              <div className="quick-actions">
                {quickActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleQuickAction(action.action)}
                    className="quick-action-btn"
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="nav-footer">
            <div className="user-info">
              <span className="user-avatar">👤</span>
              <span className="user-name">{user?.displayName || '用户'}</span>
            </div>
            <div className="experience-level">
              <span className="level-badge">{experienceLevel.name}</span>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  // Enhanced navigation for intermediate users
  const renderEnhancedNavigation = (navItems, quickActions) => (
    <nav className="adaptive-nav enhanced-nav">
      <div className="nav-header">
        <h1 className="nav-title">LingoLoopAI</h1>
        <div className="nav-search">
          <input type="search" placeholder="搜索..." className="search-input" />
        </div>
        <div className="user-menu">
          <span className="user-avatar">👤</span>
        </div>
      </div>

      <div className="nav-content">
        <div className="nav-main">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavClick(item)}
                  className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-sidebar">
          <div className="quick-actions">
            <h4 className="sidebar-title">快速操作</h4>
            {quickActions.map((action) => (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.action)}
                className="quick-action-btn compact"
              >
                <span className="action-icon">{action.icon}</span>
                <span className="action-label">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="nav-info">
            <div className="experience-info">
              <span className="level-label">当前等级:</span>
              <span className="level-badge">{experienceLevel.name}</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );

  // Efficient navigation for advanced users
  const renderEfficientNavigation = (navItems, quickActions) => (
    <nav className="adaptive-nav efficient-nav">
      <div className="nav-header">
        <h1 className="nav-title compact">LingoLoopAI</h1>
        <div className="nav-controls">
          {quickActions.slice(0, 3).map((action) => (
            <button
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className="nav-control-btn"
              title={action.label}
            >
              {action.icon}
            </button>
          ))}
          <div className="user-menu">
            <span className="user-avatar small">👤</span>
          </div>
        </div>
      </div>

      <div className="nav-content">
        <ul className="nav-list horizontal">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => handleNavClick(item)}
                className={`nav-item compact ${activeSection === item.id ? 'active' : ''}`}
                title={item.label}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Keyboard shortcuts overlay */}
      {adaptations.keyboardShortcuts && (
        <div className="shortcuts-help">
          <div className="shortcuts-content">
            <h3>键盘快捷键</h3>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>N</kbd>
                <span>新建上传</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>S</kbd>
                <span>打开设置</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd> + <kbd>D</kbd>
                <span>打开仪表板</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  // Keyboard-focused navigation for experts
  const renderKeyboardNavigation = (navItems, quickActions) => (
    <nav className="adaptive-nav keyboard-nav">
      <div className="nav-header">
        <h1 className="nav-title minimal">LL</h1>
        <div className="nav-search">
          <input
            type="search"
            placeholder="/ 搜索命令..."
            className="command-input"
            autoFocus
          />
        </div>
      </div>

      <div className="nav-content">
        <div className="command-palette">
          <div className="command-section">
            <h4>导航</h4>
            {navItems.map((item, index) => (
              <div key={item.id} className="command-item">
                <kbd>{index + 1}</kbd>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="command-section">
            <h4>操作</h4>
            {quickActions.map((action, index) => (
              <div key={action.id} className="command-item">
                <kbd>Ctrl</kbd> + <kbd>{index + 1}</kbd>
                <span>{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );

  return (
    <>
      {renderNavigation()}

      <style jsx>{`
        .adaptive-nav {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        /* Basic navigation styles */
        .basic-nav {
          padding: 1rem;
        }

        .basic-nav .nav-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .basic-nav .nav-title {
          font-size: 1.5rem;
          font-weight: bold;
        }

        .basic-nav .menu-toggle {
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          padding: 0.5rem;
          cursor: pointer;
        }

        .basic-nav .nav-section {
          margin-bottom: 1.5rem;
        }

        .basic-nav .section-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .basic-nav .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .basic-nav .nav-item {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 0.25rem;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .basic-nav .nav-item:hover {
          background: #f3f4f6;
        }

        .basic-nav .nav-item.highlight {
          background: #dbeafe;
          color: #1e40af;
        }

        .basic-nav .nav-icon {
          margin-right: 0.75rem;
          font-size: 1.25rem;
        }

        .basic-nav .quick-actions {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.5rem;
        }

        .basic-nav .quick-action-btn {
          display: flex;
          align-items: center;
          padding: 0.75rem;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .basic-nav .quick-action-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        /* Enhanced navigation styles */
        .enhanced-nav {
          display: flex;
          flex-direction: column;
        }

        .enhanced-nav .nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .enhanced-nav .nav-search {
          flex: 1;
          max-width: 400px;
          margin: 0 2rem;
        }

        .enhanced-nav .search-input {
          width: 100%;
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }

        .enhanced-nav .nav-content {
          display: flex;
          flex: 1;
        }

        .enhanced-nav .nav-main {
          flex: 1;
          padding: 1rem 2rem;
        }

        .enhanced-nav .nav-list.horizontal {
          display: flex;
          list-style: none;
          padding: 0;
          margin: 0;
          gap: 0.5rem;
        }

        /* Efficient navigation styles */
        .efficient-nav {
          padding: 0.5rem 1rem;
        }

        .efficient-nav .nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .efficient-nav .nav-title.compact {
          font-size: 1.25rem;
        }

        .efficient-nav .nav-controls {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .efficient-nav .nav-control-btn {
          padding: 0.5rem;
          background: none;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          cursor: pointer;
        }

        /* Keyboard navigation styles */
        .keyboard-nav {
          background: #1f2937;
          color: white;
        }

        .keyboard-nav .nav-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
        }

        .keyboard-nav .nav-title.minimal {
          font-size: 1rem;
          font-weight: bold;
        }

        .keyboard-nav .command-input {
          background: #374151;
          border: 1px solid #4b5563;
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 4px;
          width: 300px;
        }

        .keyboard-nav .command-palette {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          padding: 2rem;
        }

        .keyboard-nav .command-section h4 {
          margin: 0 0 1rem 0;
          color: #9ca3af;
          font-size: 0.875rem;
          text-transform: uppercase;
        }

        .keyboard-nav .command-item {
          display: flex;
          align-items: center;
          padding: 0.5rem;
          margin-bottom: 0.25rem;
          border-radius: 4px;
          cursor: pointer;
        }

        .keyboard-nav .command-item:hover {
          background: #374151;
        }

        .keyboard-nav kbd {
          background: #4b5563;
          padding: 0.25rem 0.5rem;
          border-radius: 3px;
          font-size: 0.75rem;
          margin-right: 0.75rem;
        }

        /* Common styles */
        .nav-item.active {
          background: #3b82f6;
          color: white;
        }

        .nav-item.active:hover {
          background: #2563eb;
        }

        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .level-badge {
          background: #3b82f6;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.75rem;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .enhanced-nav .nav-content {
            flex-direction: column;
          }

          .enhanced-nav .nav-sidebar {
            border-top: 1px solid #e5e7eb;
            padding-top: 1rem;
          }

          .keyboard-nav .command-palette {
            grid-template-columns: 1fr;
          }

          .efficient-nav .nav-controls {
            display: none;
          }
        }
      `}</style>
    </>
  );
};

export default AdaptiveNavigation;