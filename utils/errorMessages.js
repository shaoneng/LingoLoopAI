// utils/errorMessages.js
export const ERROR_MESSAGES = {
  // Authentication errors
  'AUTH_INVALID_CREDENTIALS': {
    title: '登录信息错误',
    message: '邮箱或密码不正确，请检查后重试',
    suggestion: '忘记密码？<a href="/forgot-password" class="text-blue-600 hover:text-blue-800">点击重置</a>',
    action: '重新输入'
  },

  'AUTH_USER_NOT_FOUND': {
    title: '用户不存在',
    message: '该邮箱地址尚未注册',
    suggestion: '请先<a href="/register" class="text-blue-600 hover:text-blue-800">注册账户</a>',
    action: '去注册'
  },

  'AUTH_TOKEN_EXPIRED': {
    title: '登录已过期',
    message: '您的登录状态已过期，请重新登录',
    suggestion: '点击"重新登录"按钮继续使用',
    action: '重新登录'
  },

  'AUTH_INVALID_TOKEN': {
    title: '登录状态异常',
    message: '登录验证失败，请重新登录',
    suggestion: '可能是网络问题，请检查网络连接',
    action: '重新登录'
  },

  // Upload errors
  'UPLOAD_FILE_TOO_LARGE': {
    title: '文件过大',
    message: '文件大小超过100MB限制',
    suggestion: '尝试压缩音频文件或选择较小的文件',
    action: '选择其他文件'
  },

  'UPLOAD_INVALID_FORMAT': {
    title: '文件格式不支持',
    message: '请选择支持的音频格式',
    suggestion: '支持格式：MP3、WAV、M4A、AAC、FLAC',
    action: '重新选择'
  },

  'UPLOAD_FAILED': {
    title: '上传失败',
    message: '文件上传过程中出现错误',
    suggestion: '请检查网络连接后重试',
    action: '重新上传'
  },

  'UPLOAD_QUOTA_EXCEEDED': {
    title: '上传配额已满',
    message: '今日上传次数或时长已达上限',
    suggestion: '升级到高级版获得更多额度，或明日再试',
    action: '升级账户'
  },

  'UPLOAD_COMMIT_FAILED': {
    title: '上传确认失败',
    message: '文件上传后无法确认完成',
    suggestion: '请检查网络连接，系统会自动重试',
    action: '手动重试'
  },

  // Transcription errors
  'TRANSCRIBE_FAILED': {
    title: '转写失败',
    message: '语音识别服务暂时不可用',
    suggestion: '请稍后重试，或联系客服获取帮助',
    action: '重新转写'
  },

  'TRANSCRIBE_NO_SPEECH': {
    title: '未检测到语音',
    message: '音频文件中未检测到有效的语音内容',
    suggestion: '请确保音频文件包含清晰的语音内容',
    action: '重新上传'
  },

  'TRANSCRIBE_LANGUAGE_NOT_SUPPORTED': {
    title: '语言不支持',
    message: '当前音频语言不被支持',
    suggestion: '目前仅支持英语音频文件',
    action: '选择英语音频'
  },

  'TRANSCRIBE_AUDIO_TOO_SHORT': {
    title: '音频过短',
    message: '音频时长太短，无法进行转写',
    suggestion: '请选择时长超过1秒的音频文件',
    action: '重新上传'
  },

  // Analysis errors
  'ANALYSIS_FAILED': {
    title: '分析失败',
    message: 'AI分析服务暂时不可用',
    suggestion: '请稍后重试，或跳过此分析',
    action: '重新分析'
  },

  'ANALYSIS_RATE_LIMITED': {
    title: '分析次数受限',
    message: 'AI分析使用次数已达今日上限',
    suggestion: '升级到高级版获得更多分析次数',
    action: '升级账户'
  },

  // Quota errors
  'QUOTA_EXCEEDED': {
    title: '使用额度已满',
    message: '今日上传次数或时长已达上限',
    suggestion: '升级到高级版获得更多额度，或明日再试',
    action: '升级账户'
  },

  'QUOTA_FILE_SIZE_EXCEEDED': {
    title: '文件大小超限',
    message: '单个文件大小超过限制',
    suggestion: '请选择小于100MB的音频文件',
    action: '重新选择'
  },

  'QUOTA_DURATION_EXCEEDED': {
    title: '音频时长超限',
    message: '音频时长超过30分钟限制',
    suggestion: '请分割音频文件或选择较短的音频',
    action: '重新选择'
  },

  'QUOTA_DAILY_UPLOAD_LIMIT': {
    title: '每日上传次数已达上限',
    message: '今日已上传文件数量达到限制',
    suggestion: '升级到高级版获得更多上传次数',
    action: '升级账户'
  },

  'QUOTA_DAILY_DURATION_LIMIT': {
    title: '每日时长已达上限',
    message: '今日上传音频总时长达到限制',
    suggestion: '升级到高级版获得更多时长额度',
    action: '升级账户'
  },

  // Network errors
  'NETWORK_ERROR': {
    title: '网络连接异常',
    message: '无法连接到服务器',
    suggestion: '请检查网络连接后重试',
    action: '重试'
  },

  'NETWORK_TIMEOUT': {
    title: '网络请求超时',
    message: '服务器响应时间过长',
    suggestion: '请检查网络连接或稍后重试',
    action: '重试'
  },

  'NETWORK_OFFLINE': {
    title: '网络离线',
    message: '当前网络连接已断开',
    suggestion: '请检查网络设置并重新连接',
    action: '重新连接'
  },

  // Server errors
  'SERVER_ERROR': {
    title: '服务器内部错误',
    message: '服务器处理请求时出现问题',
    suggestion: '请稍后重试，或联系客服获取帮助',
    action: '重试'
  },

  'SERVER_MAINTENANCE': {
    title: '服务器维护中',
    message: '系统正在维护升级',
    suggestion: '请30分钟后重试，或关注官方公告',
    action: '了解详情'
  },

  'SERVER_OVERLOAD': {
    title: '服务器繁忙',
    message: '服务器当前负载过高',
    suggestion: '请稍后重试，系统会自动恢复正常',
    action: '重试'
  },

  // Validation errors
  'VALIDATION_REQUIRED_FIELD': {
    title: '必填字段缺失',
    message: '请填写所有必填字段',
    suggestion: '请检查表单中的必填项',
    action: '重新填写'
  },

  'VALIDATION_INVALID_EMAIL': {
    title: '邮箱格式错误',
    message: '请输入有效的邮箱地址',
    suggestion: '邮箱格式示例：user@example.com',
    action: '重新输入'
  },

  'VALIDATION_PASSWORD_TOO_SHORT': {
    title: '密码过短',
    message: '密码长度至少需要8个字符',
    suggestion: '建议使用字母、数字和符号的组合',
    action: '重新输入'
  },

  'VALIDATION_PASSWORD_TOO_WEAK': {
    title: '密码强度不足',
    message: '密码安全性较低',
    suggestion: '建议使用字母、数字和符号的组合',
    action: '重新输入'
  },

  // Payment errors
  'PAYMENT_FAILED': {
    title: '支付失败',
    message: '支付处理过程中出现错误',
    suggestion: '请检查支付信息或稍后重试',
    action: '重新支付'
  },

  'PAYMENT_CANCELLED': {
    title: '支付已取消',
    message: '支付过程被用户取消',
    suggestion: '如需继续使用，请重新发起支付',
    action: '重新支付'
  },

  'PAYMENT_EXPIRED': {
    title: '支付已过期',
    message: '支付链接已过期',
    suggestion: '请重新发起支付流程',
    action: '重新支付'
  },

  // File processing errors
  'FILE_PROCESSING_FAILED': {
    title: '文件处理失败',
    message: '音频文件处理过程中出现错误',
    suggestion: '请检查音频文件格式是否正确',
    action: '重新上传'
  },

  'FILE_CORRUPTED': {
    title: '文件损坏',
    message: '音频文件可能已损坏',
    suggestion: '请重新下载或选择其他音频文件',
    action: '重新选择'
  },

  'FILE_NOT_FOUND': {
    title: '文件不存在',
    message: '请求的音频文件不存在',
    suggestion: '请检查文件路径或重新上传',
    action: '重新上传'
  },

  // Permission errors
  'PERMISSION_DENIED': {
    title: '权限不足',
    message: '您没有执行此操作的权限',
    suggestion: '请检查账户权限或联系管理员',
    action: '联系支持'
  },

  'ACCOUNT_SUSPENDED': {
    title: '账户已暂停',
    message: '您的账户因违规操作已被暂停',
    suggestion: '请联系客服了解具体情况',
    action: '联系支持'
  },

  'ACCOUNT_BANNED': {
    title: '账户已封禁',
    message: '您的账户因严重违规已被永久封禁',
    suggestion: '请联系客服了解具体情况',
    action: '联系支持'
  }
};

export const DEFAULT_ERROR = {
  title: '未知错误',
  message: '出现未知错误，请稍后重试',
  suggestion: '如果问题持续存在，请联系客服获取帮助',
  action: '重试'
};

export const getUserFriendlyError = (error) => {
  if (!error) return DEFAULT_ERROR;

  // Try to get error code from various sources
  const errorCode = error.code || error.message || error.error || 'UNKNOWN_ERROR';

  // Try to find exact match first
  let friendlyError = ERROR_MESSAGES[errorCode];

  if (friendlyError) {
    return friendlyError;
  }

  // Try to match by error message keywords
  const errorMessage = (error.message || error.error || '').toLowerCase();

  if (errorMessage.includes('quota') || errorMessage.includes('配额')) {
    return ERROR_MESSAGES.QUOTA_EXCEEDED;
  }

  if (errorMessage.includes('network') || errorMessage.includes('网络')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  if (errorMessage.includes('timeout') || errorMessage.includes('超时')) {
    return ERROR_MESSAGES.NETWORK_TIMEOUT;
  }

  if (errorMessage.includes('offline') || errorMessage.includes('离线')) {
    return ERROR_MESSAGES.NETWORK_OFFLINE;
  }

  if (errorMessage.includes('upload') || errorMessage.includes('上传')) {
    return ERROR_MESSAGES.UPLOAD_FAILED;
  }

  if (errorMessage.includes('transcribe') || errorMessage.includes('转写')) {
    return ERROR_MESSAGES.TRANSCRIBE_FAILED;
  }

  if (errorMessage.includes('auth') || errorMessage.includes('认证')) {
    return ERROR_MESSAGES.AUTH_INVALID_CREDENTIALS;
  }

  if (errorMessage.includes('permission') || errorMessage.includes('权限')) {
    return ERROR_MESSAGES.PERMISSION_DENIED;
  }

  if (errorMessage.includes('payment') || errorMessage.includes('支付')) {
    return ERROR_MESSAGES.PAYMENT_FAILED;
  }

  // Return default error if no match found
  return DEFAULT_ERROR;
};

export const getErrorDetails = (error) => {
  if (!error) return null;

  return {
    code: error.code || 'UNKNOWN_ERROR',
    message: error.message || error.error || 'Unknown error occurred',
    traceId: error.traceId || null,
    timestamp: error.timestamp || new Date().toISOString(),
    stack: error.stack || null,
    details: error.details || null
  };
};