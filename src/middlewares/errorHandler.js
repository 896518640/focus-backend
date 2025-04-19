// errorHandler.js
// 全局错误处理中间件，捕获抛出的错误并格式化响应

import createLogger from '../utils/logger.js';
import { AppError } from '../utils/errors.js';
import configService from '../config/configService.js';

const logger = createLogger('ErrorHandler');

/**
 * 处理错误的中间件
 * 捕获并格式化各种类型的错误响应
 */
export const handleError = (err, req, res, next) => {
  // 获取错误详情
  const errorDetails = getErrorDetails(err);
  
  // 记录错误日志，包含请求信息
  logError(err, req, errorDetails.status);
  
  // 在开发环境下，包含更多细节
  const isDev = configService.get('app.env', 'development') === 'development';
  const response = formatErrorResponse(errorDetails, isDev);
  
  // 发送错误响应
  res.status(errorDetails.status).json(response);
};

/**
 * 获取错误的详细信息
 * @param {Error} err - 捕获的错误
 * @returns {Object} 错误详情
 */
function getErrorDetails(err) {
  // 默认错误详情
  const details = {
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: '服务器内部错误',
    details: null
  };
  
  // 如果是自定义错误类型
  if (err instanceof AppError) {
    details.status = err.statusCode;
    details.code = err.name;
    details.message = err.message;
    details.details = err.data || null;
  } 
  // 处理常见的Node.js错误
  else if (err.code === 'ECONNREFUSED') {
    details.status = 503;
    details.code = 'SERVICE_UNAVAILABLE';
    details.message = '无法连接到外部服务';
  }
  else if (err.name === 'ValidationError') {
    details.status = 400;
    details.code = 'VALIDATION_ERROR';
    details.message = err.message;
  }
  else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    details.status = 400;
    details.code = 'INVALID_JSON';
    details.message = '请求JSON格式无效';
  }
  else {
    // 其他错误，使用提供的信息或默认值
    details.status = err.status || err.statusCode || 500;
    details.message = err.message || details.message;
    details.code = err.code || details.code;
  }
  
  return details;
}

/**
 * 记录错误日志
 * @param {Error} err - 捕获的错误
 * @param {Object} req - 请求对象
 * @param {number} status - HTTP状态码
 */
function logError(err, req, status) {
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const user = req.user ? `用户ID: ${req.user.id}` : '未认证用户';
  
  // 根据错误的严重性来选择日志级别
  if (status >= 500) {
    logger.error(
      `[${method} ${url}] ${status} - ${err.message}
      IP: ${ip}, ${user}
      Stack: ${err.stack}`,
      err
    );
  } else if (status >= 400 && status < 500) {
    logger.warn(
      `[${method} ${url}] ${status} - ${err.message}
      IP: ${ip}, ${user}`,
      err.details || {}
    );
  } else {
    logger.info(
      `[${method} ${url}] ${status} - ${err.message}
      IP: ${ip}, ${user}`
    );
  }
}

/**
 * 格式化错误响应
 * @param {Object} errorDetails - 错误详情
 * @param {boolean} includeDetails - 是否包含详细信息
 * @returns {Object} 格式化的错误响应
 */
function formatErrorResponse(errorDetails, includeDetails = false) {
  const response = {
    success: false,
    error: {
      code: errorDetails.code,
      message: errorDetails.message
    }
  };
  
  // 在开发环境或指定情况下包含详细错误信息
  if (includeDetails && errorDetails.details) {
    response.error.details = errorDetails.details;
  }
  
  return response;
}

export default handleError;