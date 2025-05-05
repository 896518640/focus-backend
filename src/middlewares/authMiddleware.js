// 认证相关中间件，包括用户身份验证和权限控制

import authController from '../controllers/authController.js';
import createLogger from '../utils/logger.js';
import { formatResponse } from '../utils/responseFormatter.js';

const logger = createLogger('AuthMiddleware');

/**
 * 验证用户是否已认证
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
export function authenticate(req, res, next) {
  // 直接使用authController的verifyToken方法
  return authController.verifyToken(req, res, next);
}

/**
 * 验证用户是否具有特定角色
 * @param {String|Array} roles - 允许的角色或角色数组
 * @returns {Function} - 中间件函数
 */
export function authorize(roles) {
  // 将单个角色转换为数组
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      // 确保用户已通过认证
      if (!req.user) {
        logger.warn('未经认证的用户尝试访问受保护资源');
        return res.status(401).json(formatResponse(401, '请先登录'));
      }
      
      // 检查用户角色是否在允许的角色中
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.username} 权限不足，尝试访问需要 ${allowedRoles.join(', ')} 角色的资源`);
        return res.status(403).json(formatResponse(403, '权限不足，无法访问此资源'));
      }
      
      // 权限验证通过，继续下一个中间件
      next();
    } catch (error) {
      logger.error('授权中间件错误:', error);
      return res.status(500).json(formatResponse(500, '服务器错误，请稍后再试'));
    }
  };
}