// 自定义错误类系统
// 为应用提供统一的错误处理机制

/**
 * 自定义错误基类
 * 所有自定义错误类型的基础
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, data = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 配置错误
 * 用于配置相关的错误
 */
export class ConfigError extends AppError {
  constructor(message, data = {}) {
    super(message, 500, data);
  }
}

/**
 * 验证错误
 * 用于参数验证失败等情况
 */
export class ValidationError extends AppError {
  constructor(message, data = {}) {
    super(message, 400, data);
  }
}

/**
 * 未找到资源错误
 * 用于请求的资源不存在的情况
 */
export class NotFoundError extends AppError {
  constructor(message = '请求的资源不存在', data = {}) {
    super(message, 404, data);
  }
}

/**
 * 认证错误
 * 用于未认证或认证失败的情况
 */
export class AuthenticationError extends AppError {
  constructor(message = '认证失败', data = {}) {
    super(message, 401, data);
  }
}

/**
 * 授权错误
 * 用于无权限访问的情况
 */
export class AuthorizationError extends AppError {
  constructor(message = '没有访问权限', data = {}) {
    super(message, 403, data);
  }
}

/**
 * 服务错误
 * 用于外部服务调用失败的情况
 */
export class ServiceError extends AppError {
  constructor(message, data = {}) {
    super(message, 500, data);
  }
}

/**
 * 语音服务错误
 * 语音识别服务相关错误
 */
export class SpeechServiceError extends ServiceError {
  constructor(message, data = {}) {
    super(message, data);
  }
}

/**
 * 连接错误
 * 网络连接相关错误
 */
export class ConnectionError extends ServiceError {
  constructor(message, data = {}) {
    super(message, data);
  }
}

/**
 * 数据库错误
 * 数据库操作相关错误
 */
export class DatabaseError extends ServiceError {
  constructor(message, data = {}) {
    super(message, data);
  }
}

/**
 * 业务逻辑错误
 * 业务逻辑验证失败的情况
 */
export class BusinessError extends AppError {
  constructor(message, data = {}) {
    super(message, 400, data);
  }
}

/**
 * 格式化错误为客户端响应
 * @param {Error} error - 错误对象
 * @returns {Object} 格式化后的错误响应
 */
export function formatErrorResponse(error) {
  if (error instanceof AppError) {
    return {
      success: false,
      code: error.statusCode,
      message: error.message,
      error: {
        type: error.name,
        data: error.data
      }
    };
  }

  // 处理普通 Error 对象
  return {
    success: false,
    code: 500,
    message: error.message || '服务器内部错误',
    error: {
      type: error.name || 'GeneralError'
    }
  };
}