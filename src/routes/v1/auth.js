import express from 'express';
import AuthController from '../../controllers/authController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { loginValidation, registerValidation } from '../../middlewares/validationMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/v1/auth/login
 * @desc 用户登录
 * @access 公开
 */
router.post('/login', loginValidation, AuthController.login);

/**
 * @route POST /api/v1/auth/register
 * @desc 用户注册
 * @access 公开
 */
router.post('/register', registerValidation, AuthController.register);

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access 需要认证
 */
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router; 