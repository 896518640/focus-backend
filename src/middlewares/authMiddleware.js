import AuthController from '../controllers/authController.js';
import createLogger from '../utils/logger.js';

const logger = createLogger('AuthMiddleware');

/**
 * 验证用户是否已认证
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
export function authenticate(req, res, next) {
  try {
    // 获取请求头中的Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('未提供Authorization令牌');
      return res.status(401).json({
        code: 401,
        message: '未授权访问，请提供有效Token',
      });
    }

    // 提取令牌
    const token = authHeader.split(' ')[1];
    
    // 验证令牌
    const decoded = AuthController.verifyToken(token);
    
    if (!decoded) {
      logger.warn('无效的Authorization令牌');
      return res.status(401).json({
        code: 401,
        message: '令牌无效或已过期',
      });
    }

    // 将用户信息附加到请求对象
    req.user = decoded;
    
    // 继续下一个中间件
    next();
  } catch (error) {
    logger.error('认证中间件错误:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器错误，请稍后再试',
    });
  }
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
        return res.status(401).json({
          code: 401,
          message: '请先登录',
        });
      }
      
      // 检查用户角色是否在允许的角色中
      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.username} 权限不足，尝试访问需要 ${allowedRoles.join(', ')} 角色的资源`);
        return res.status(403).json({
          code: 403,
          message: '权限不足，无法访问此资源',
        });
      }
      
      // 权限验证通过，继续下一个中间件
      next();
    } catch (error) {
      logger.error('授权中间件错误:', error);
      return res.status(500).json({
        code: 500,
        message: '服务器错误，请稍后再试',
      });
    }
  };
} 