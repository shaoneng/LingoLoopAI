import React, { createContext, useContext, useEffect, useState } from 'react';
import { post, authenticatedPost } from '../lib/api';
import { API_ENDPOINTS } from '../lib/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // 从 localStorage 恢复认证状态
  useEffect(() => {
    const savedAuth = localStorage.getItem('lingoloop.auth.v1');
    if (savedAuth) {
      try {
        const { user, accessToken } = JSON.parse(savedAuth);
        setUser(user);
        setAccessToken(accessToken);
      } catch (error) {
        console.error('Failed to parse auth data from localStorage:', error);
        localStorage.removeItem('lingoloop.auth.v1');
      }
    }
    setLoading(false);
  }, []);

  // 保存认证状态到 localStorage
  const saveAuthToStorage = (userData, token) => {
    const authData = {
      user: userData,
      accessToken: token,
    };
    localStorage.setItem('lingoloop.auth.v1', JSON.stringify(authData));
  };

  // 清除认证状态
  const clearAuthFromStorage = () => {
    localStorage.removeItem('lingoloop.auth.v1');
    setUser(null);
    setAccessToken(null);
  };

  // 登录
  const login = async (email, password) => {
    try {
      console.log('Attempting login...');

      const response = await post(API_ENDPOINTS.AUTH_LOGIN, {
        email,
        password,
      });

      console.log('Login response:', response);

      if (response.user && response.accessToken) {
        // 保存认证状态
        saveAuthToStorage(response.user, response.accessToken);
        setUser(response.user);
        setAccessToken(response.accessToken);

        // 保存 refresh token (如果需要)
        if (response.refreshToken) {
          localStorage.setItem('lingoloop.refresh.token', response.refreshToken);
        }

        return { success: true, user: response.user };
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = '登录失败，请检查邮箱和密码';
      if (error.message.includes('401')) {
        errorMessage = '邮箱或密码错误';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (error.message.includes('API request failed')) {
        errorMessage = '服务器暂时不可用，请稍后再试';
      }

      return { success: false, error: errorMessage };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      console.log('Attempting registration...');

      const response = await post(API_ENDPOINTS.AUTH_REGISTER, {
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName || userData.email,
      });

      console.log('Registration response:', response);

      if (response.user && response.accessToken) {
        // 保存认证状态
        saveAuthToStorage(response.user, response.accessToken);
        setUser(response.user);
        setAccessToken(response.accessToken);

        // 保存 refresh token
        if (response.refreshToken) {
          localStorage.setItem('lingoloop.refresh.token', response.refreshToken);
        }

        return { success: true, user: response.user };
      } else {
        throw new Error('注册响应格式错误');
      }
    } catch (error) {
      console.error('Registration error:', error);

      let errorMessage = '注册失败，请稍后再试';
      if (error.message.includes('409')) {
        errorMessage = '该邮箱已被注册，请使用其他邮箱';
      } else if (error.message.includes('400')) {
        errorMessage = '注册信息不完整或格式错误';
      } else if (error.message.includes('Network Error')) {
        errorMessage = '网络连接失败，请检查网络设置';
      } else if (error.message.includes('API request failed')) {
        errorMessage = '服务器暂时不可用，请稍后再试';
      }

      return { success: false, error: errorMessage };
    }
  };

  // 登出
  const logout = async () => {
    try {
      if (accessToken) {
        await authenticatedPost(API_ENDPOINTS.AUTH_LOGOUT, accessToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
      // 即使登出失败，也要清除本地状态
    } finally {
      clearAuthFromStorage();
      localStorage.removeItem('lingoloop.refresh.token');
    }
  };

  // 刷新 token
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('lingoloop.refresh.token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await post(API_ENDPOINTS.AUTH_REFRESH, {
        refreshToken,
      });

      if (response.accessToken) {
        saveAuthToStorage(user, response.accessToken);
        setAccessToken(response.accessToken);

        // 更新 refresh token
        if (response.refreshToken) {
          localStorage.setItem('lingoloop.refresh.token', response.refreshToken);
        }

        return response.accessToken;
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthFromStorage();
      localStorage.removeItem('lingoloop.refresh.token');
      throw error;
    }
  };

  // 更新用户信息
  const updateUser = (userData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...userData,
    }));

    // 更新 localStorage 中的用户信息
    const savedAuth = localStorage.getItem('lingoloop.auth.v1');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        authData.user = { ...authData.user, ...userData };
        localStorage.setItem('lingoloop.auth.v1', JSON.stringify(authData));
      } catch (error) {
        console.error('Failed to update user in localStorage:', error);
      }
    }
  };

  // 检查认证状态
  const isAuthenticated = () => {
    return !!user && !!accessToken;
  };

  // 获取认证头
  const getAuthHeader = () => {
    if (!accessToken) return null;
    return `Bearer ${accessToken}`;
  };

  const value = {
    user,
    accessToken,
    loading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated,
    getAuthHeader,
    // 便捷方法
    isAuthenticated: () => !!user && !!accessToken,
    hasRole: (role) => user?.role === role,
    isAdmin: () => user?.role === 'ADMIN',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 高阶组件：需要认证的组件
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { user, loading } = useAuth();

    if (loading) {
      return <div>加载中...</div>;
    }

    if (!user) {
      return <div>请先登录</div>;
    }

    return <Component {...props} />;
  };
}

// 认证状态 Hook
export function useAuthStatus() {
  const { user, loading, isAuthenticated } = useAuth();
  return {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    isLoggedIn: isAuthenticated(),
  };
}