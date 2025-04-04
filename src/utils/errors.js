// 自定义错误基类
export class AppError extends Error {
  constructor(message, statusCode = 500, data = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 配置错误
export class ConfigError extends AppError {
  constructor(message, data = {}) {
    super(message, 500, data);
  }
}

// 语音服务错误
export class SpeechServiceError extends AppError {
  constructor(message, data = {}) {
    super(message, 500, data);
  }
}

// 连接错误
export class ConnectionError extends AppError {
  constructor(message, data = {}) {
    super(message, 500, data);
  }
}

// 格式化错误为客户端响应
export function formatErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      error: {
        message: error.message,
        type: error.name,
        data: error.data
      }
    };
  }

  // 处理普通 Error 对象
  return {
    error: {
      message: error.message || '未知错误',
      type: 'GeneralError'
    }
  };
} 