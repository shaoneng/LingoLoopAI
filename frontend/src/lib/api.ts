/**
 * API 统一调用模块
 * 用于连接 Cloudflare Workers 后端 API
 */

// API 基础 URL 配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.your-domain.com';

// API 响应接口
interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
  items?: T[];
  hasMore?: boolean;
}

// 请求选项接口
interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
}

/**
 * 统一 API 请求函数
 * @param endpoint API 端点路径
 * @param options 请求选项
 * @returns Promise<ApiResponse>
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  // 构建完整的 URL
  let url = `${API_BASE_URL}${endpoint}`;

  // 添加查询参数
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      url += `?${searchParams.toString()}`;
    }
  }

  // 设置默认请求头
  const headers = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  try {
    console.log(`API Request: ${method} ${url}`);

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // 解析响应
    const data = await response.json();
    console.log('API Response:', data);

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

/**
 * GET 请求
 * @param endpoint API 端点
 * @param params 查询参数
 * @param options 请求选项
 */
export async function get<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  options: Omit<RequestOptions, 'params' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'GET',
    params,
  });
}

/**
 * POST 请求
 * @param endpoint API 端点
 * @param data 请求体数据
 * @param options 请求选项
 */
export async function post<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PUT 请求
 * @param endpoint API 端点
 * @param data 请求体数据
 * @param options 请求选项
 */
export async function put<T = any>(
  endpoint: string,
  data?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE 请求
 * @param endpoint API 端点
 * @param options 请求选项
 */
export async function del<T = any>(
  endpoint: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * 带认证的请求
 * @param endpoint API 端点
 * @param accessToken 访问令牌
 * @param options 请求选项
 */
export async function authenticatedRequest<T = any>(
  endpoint: string,
  accessToken: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

/**
 * 带认证的 GET 请求
 */
export async function authenticatedGet<T = any>(
  endpoint: string,
  accessToken: string,
  params?: Record<string, any>,
  options: Omit<RequestOptions, 'params' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return authenticatedRequest<T>(endpoint, accessToken, {
    ...options,
    method: 'GET',
    params,
  });
}

/**
 * 带认证的 POST 请求
 */
export async function authenticatedPost<T = any>(
  endpoint: string,
  accessToken: string,
  data?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return authenticatedRequest<T>(endpoint, accessToken, {
    ...options,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 带认证的 PUT 请求
 */
export async function authenticatedPut<T = any>(
  endpoint: string,
  accessToken: string,
  data?: any,
  options: Omit<RequestOptions, 'body' | 'method'> = {}
): Promise<ApiResponse<T>> {
  return authenticatedRequest<T>(endpoint, accessToken, {
    ...options,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * 带认证的 DELETE 请求
 */
export async function authenticatedDelete<T = any>(
  endpoint: string,
  accessToken: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<ApiResponse<T>> {
  return authenticatedRequest<T>(endpoint, accessToken, {
    ...options,
    method: 'DELETE',
  });
}

/**
 * 文件上传函数 (适配 Workers)
 * @param endpoint 上传端点
 * @param file 文件对象
 * @param accessToken 访问令牌
 * @param additionalData 额外数据
 */
export async function uploadFile(
  endpoint: string,
  file: File,
  accessToken: string,
  additionalData: Record<string, any> = {}
): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // 添加额外数据
  Object.entries(additionalData).forEach(([key, value]) => {
    formData.append(key, String(value));
  });

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        // 注意：不设置 Content-Type，让浏览器自动设置 multipart/form-data
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

// 导出 API 端点常量
export const API_ENDPOINTS = {
  // 认证相关
  AUTH_LOGIN: '/api/auth/login',
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_REFRESH: '/api/auth/refresh',

  // 音频相关
  AUDIOS: '/api/audios',
  AUDIO_DETAIL: (id: string) => `/api/audios/${id}`,
  AUDIO_TRANSCRIBE: (id: string) => `/api/audios/${id}/transcribe`,
  AUDIO_DOWNLOAD: (id: string) => `/api/audios/${id}/download`,

  // 用户相关
  USER_PROFILE: '/api/user/profile',
  USER_STATS: '/api/user/stats',
  USER_PROGRESS: '/api/user/progress',

  // 管理员相关
  ADMIN_SHARED_RESOURCES: '/api/admin/shared-resources',
  ADMIN_MANAGE_RESOURCES: '/api/admin/manage-resources',

  // 上传相关
  UPLOADS_CREATE: '/api/uploads/create',
  UPLOADS_COMMIT: '/api/uploads/commit',

  // 健康检查
  HEALTH: '/health',
} as const;

export default apiRequest;