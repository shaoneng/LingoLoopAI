import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const MobileNavigation = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();

  const navigationItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/dashboard', label: '工作台', icon: '📊' },
    { path: '/library', label: '音频库', icon: '📚' },
    { path: '/discover', label: '发现', icon: '🔍' },
  ];

  const userMenuItems = user ? [
    { path: '/profile', label: '个人中心', icon: '👤' },
    { path: '/settings', label: '设置', icon: '⚙️' },
    { path: '/help', label: '帮助', icon: '❓' },
  ] : [
    { path: '/login', label: '登录', icon: '🔑' },
    { path: '/register', label: '注册', icon: '📝' },
  ];

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigation = (path) => {
    router.push(path);
    closeSidebar();
  };

  // Handle scroll effect for top navigation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    closeSidebar();
  }, [router.pathname]);

  return (
    <>
      {/* Mobile Top Navigation */}
      <div className={`mobile-top-nav ${isScrolled ? 'scrolled' : ''}`}>
        <button
          className="menu-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="打开菜单"
        >
          <span className="menu-icon">☰</span>
        </button>

        <div className="app-title" onClick={() => router.push('/')}>
          LingoLoopAI
        </div>

        {user ? (
          <div className="user-avatar">
            <span className="avatar-text">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
            </span>
          </div>
        ) : (
          <button
            className="login-button"
            onClick={() => router.push('/login')}
          >
            登录
          </button>
        )}
      </div>

      {/* Side Navigation */}
      <div className={`mobile-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3 className="sidebar-title">菜单</h3>
          <button
            className="close-button"
            onClick={closeSidebar}
            aria-label="关闭菜单"
          >
            ✕
          </button>
        </div>

        {user && (
          <div className="user-section">
            <div className="user-info">
              <div className="user-avatar-large">
                <span className="avatar-text-large">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="user-details">
                <div className="user-name">
                  {user.displayName || '用户'}
                </div>
                <div className="user-email">
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">主要功能</h4>
            {navigationItems.map(item => (
              <button
                key={item.path}
                className={`nav-item ${router.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {router.pathname === item.path && <span className="nav-indicator">•</span>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">账户管理</h4>
            {userMenuItems.map(item => (
              <button
                key={item.path}
                className={`nav-item ${router.pathname === item.path ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {router.pathname === item.path && <span className="nav-indicator">•</span>}
              </button>
            ))}

            {user && (
              <button
                className="nav-item logout-item"
                onClick={handleLogout}
              >
                <span className="nav-icon">🚪</span>
                <span className="nav-label">退出登录</span>
              </button>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="app-info">
            <div className="app-name">LingoLoopAI</div>
            <div className="app-version">v1.0.0</div>
          </div>
          <div className="footer-links">
            <a href="/privacy" className="footer-link">隐私政策</a>
            <a href="/terms" className="footer-link">服务条款</a>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        {navigationItems.slice(0, 4).map(item => (
          <button
            key={item.path}
            className={`bottom-nav-item ${router.pathname === item.path ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
        />
      )}
    </>
  );
};

export default MobileNavigation;