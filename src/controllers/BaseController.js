// BaseController.js
// 基础控制器类，提供标准化的响应方法和错误处理

import createLogger from '../utils/logger.js';

/**
 * 基础控制器
 * 为所有控制器提供统一的响应格式化方法和错误处理
 */
class BaseController {
  constructor(loggerName = 'BaseController') {
    this.logger = createLogger(loggerName);
  }

  /**
   * 发送成功响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 成功消息
   * @param {Object} data - 响应数据
   * @param {Number} statusCode - HTTP状态码
   * @returns {Object} Express响应
   */
  success(res, message = '操作成功', data = null, statusCode = 200) {
    console.log('success', JSON.stringify(data));
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 发送失败响应
   * @param {Object} res - Express响应对象
   * @param {String} message - 错误消息
   * @param {Object} error - 错误对象或详情
   * @param {Number} statusCode - HTTP状态码
   * @returns {Object} Express响应
   */
  fail(res, message = '操作失败', error = null, statusCode = 400) {
    // 记录错误日志
    this.logger.error(`请求失败: ${message}`, error);
    
    // 构建错误响应
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString()
    };

    // 只在开发环境添加详细错误信息
    if (process.env.NODE_ENV !== 'production' && error) {
      response.error = typeof error === 'object' ? error.message || String(error) : error;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * 包装控制器方法，统一处理异常
   * @param {Function} fn - 控制器方法
   * @returns {Function} 包装后的控制器方法
   */
  handleAsync(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (error) {
        this.fail(res, error.message || '请求处理失败', error, error.status || 500);
      }
    };
  }
}

export default BaseController;