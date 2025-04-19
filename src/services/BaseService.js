// BaseService.js
// 基础服务类，提供共享功能和统一模式

import createLogger from '../utils/logger.js';

/**
 * 基础服务类
 * 为所有服务提供日志、错误处理等共享功能
 */
class BaseService {
  /**
   * 构造函数
   * @param {String} serviceName - 服务名称，用于日志
   */
  constructor(serviceName) {
    this.logger = createLogger(serviceName);
  }

  /**
   * 执行服务方法并统一处理异常
   * @param {Function} fn - 要执行的方法
   * @param {Array} args - 参数数组
   * @param {String} errorMessage - 出错时的错误消息
   * @returns {Promise<any>} 方法执行结果
   */
  async executeWithErrorHandling(fn, args = [], errorMessage = '操作执行失败') {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      this.logger.error(`${errorMessage}: ${error.message}`, error);
      // 保留原始错误的状态码（如果有）
      const enhancedError = new Error(error.message || errorMessage);
      enhancedError.status = error.status || 500;
      enhancedError.originalError = error;
      throw enhancedError;
    }
  }

  /**
   * 验证必要参数
   * @param {Object} params - 参数对象
   * @param {Array<String>} requiredFields - 必需字段列表
   * @throws {Error} 如果缺少必要参数则抛出异常
   */
  validateRequiredParams(params, requiredFields) {
    const missingFields = requiredFields.filter(field => {
      const value = params[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      const error = new Error(`缺少必要参数: ${missingFields.join(', ')}`);
      error.status = 400;
      throw error;
    }
  }

  /**
   * 安全解析JSON字符串
   * @param {String|Object} input - 要解析的输入
   * @param {String} errorPrefix - 错误消息前缀
   * @returns {Object} 解析后的对象
   */
  safelyParseJSON(input, errorPrefix = '解析JSON失败') {
    if (typeof input === 'object') return input;
    
    try {
      return JSON.parse(input);
    } catch (error) {
      const parseError = new Error(`${errorPrefix}: ${error.message}`);
      parseError.status = 400;
      throw parseError;
    }
  }
}

export default BaseService;
