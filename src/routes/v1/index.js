import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import createLogger from '../../utils/logger.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import AuthController from '../../controllers/authController.js';
import tingwuRoutes from './tingwuRoutes.js';

const logger = createLogger('APIRoutes');
const router = express.Router();

// 注册认证路由
router.use('/auth', authRoutes);

// 注册用户路由
router.use('/user', userRoutes);

// 注册通义听悟路由
router.use('/tingwu', tingwuRoutes);

// 用户相关路由
router.get('/users/current', authenticate, AuthController.getCurrentUser);

// API状态检查路由
router.get('/status', (req, res) => {
  logger.info('API状态检查');
  res.json({
    code: 0,
    message: 'API服务正常',
    timestamp: new Date().toISOString(),
    version: 'v1'
  });
});

export default router;