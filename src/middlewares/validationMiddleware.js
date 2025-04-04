import { body, validationResult } from 'express-validator';
import createLogger from '../utils/logger.js';

const logger = createLogger('ValidationMiddleware');

/**
 * 处理验证结果
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 * @param {Function} next - 下一个中间件函数
 */
export function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    logger.warn('输入验证失败:', errorMessages);
    
    return res.status(400).json({
      code: 400,
      message: '输入验证失败',
      errors: errorMessages,
    });
  }
  
  next();
}

/**
 * 登录验证规则
 */
export const loginValidation = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间'),
  
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度应至少为6个字符'),
    
  handleValidationErrors,
];

/**
 * 注册验证规则
 */
export const registerValidation = [
  body('username')
    .notEmpty().withMessage('用户名不能为空')
    .isLength({ min: 3, max: 20 }).withMessage('用户名长度应在3-20个字符之间')
    .matches(/^[a-zA-Z0-9_-]+$/).withMessage('用户名只能包含字母、数字、下划线和连字符'),
  
  body('email')
    .notEmpty().withMessage('邮箱不能为空')
    .isEmail().withMessage('请提供有效的邮箱地址'),
  
  body('password')
    .notEmpty().withMessage('密码不能为空')
    .isLength({ min: 6 }).withMessage('密码长度应至少为6个字符')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]/).withMessage('密码必须包含至少一个字母和一个数字'),
    
  handleValidationErrors,
]; 