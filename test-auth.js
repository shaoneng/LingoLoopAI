#!/usr/bin/env node

// 简单的认证测试脚本
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('=== 测试认证系统 ===');

  try {
    // 1. 注册新用户
    console.log('\n1. 注册新用户...');
    const registerData = {
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    };

    const registerResponse = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const registerResult = await registerResponse.json();
    console.log('注册结果:', registerResponse.status, registerResult);

    if (registerResponse.ok) {
      console.log('✅ 注册成功');
      console.log('用户信息:', registerResult.user);
      console.log('Access Token:', registerResult.accessToken?.substring(0, 20) + '...');
      console.log('Refresh Token:', registerResult.refreshToken?.substring(0, 20) + '...');
    } else {
      console.log('❌ 注册失败:', registerResult.error);
    }

    // 2. 尝试登录
    console.log('\n2. 测试登录...');
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const loginResult = await loginResponse.json();
    console.log('登录结果:', loginResponse.status, loginResult);

    if (loginResponse.ok) {
      console.log('✅ 登录成功');
      console.log('用户信息:', loginResult.user);
      console.log('Access Token:', loginResult.accessToken?.substring(0, 20) + '...');
      console.log('Refresh Token:', loginResult.refreshToken?.substring(0, 20) + '...');

      // 3. 测试刷新令牌
      console.log('\n3. 测试刷新令牌...');
      const refreshResponse = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: loginResult.refreshToken
        }),
      });

      const refreshResult = await refreshResponse.json();
      console.log('刷新结果:', refreshResponse.status, refreshResult);

      if (refreshResponse.ok) {
        console.log('✅ 刷新令牌成功');
        console.log('新的Access Token:', refreshResult.accessToken?.substring(0, 20) + '...');
      } else {
        console.log('❌ 刷新令牌失败:', refreshResult.error);
      }

    } else {
      console.log('❌ 登录失败:', loginResult.error);
    }

  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testAuth();