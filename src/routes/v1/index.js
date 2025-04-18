// index.js
// API 主路由配置文件

import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './user.js';
import tingwuRoutes from './tingwuRoutes.js';
import createLogger from '../../utils/logger.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import authController from '../../controllers/authController.js';
import { registerRoutes, createRouteHelper } from '../../utils/routeHelper.js';

const logger = createLogger('APIRoutes');
const router = express.Router();

// 创建认证控制器助手
const authHandler = createRouteHelper(authController);

// 注册子路由模块
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/tingwu', tingwuRoutes);

// 定义主路由配置
const routes = [
  // 用户相关路由
  { 
    path: '/users/current', 
    method: 'get', 
    handler: authHandler.getCurrentUser, 
    middlewares: [authenticate],
    description: '获取当前登录用户信息'
  },
  
  // API状态检查路由
  { 
    path: '/status', 
    method: 'get', 
    handler: (req, res) => {
      logger.info('API状态检查');
      res.json({
        code: 0,
        message: 'API服务正常',
        timestamp: new Date().toISOString(),
        version: 'v1'
      });
    },
    description: 'API服务状态检查'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('API主路由模块已加载');

// 添加404处理中间件
router.use((req, res) => {
  logger.warn(`API路由未找到: ${req.method} ${req.path}`);
  res.status(404).json({
    code: 404,
    message: '请求的API接口不存在',
    path: req.path
  });
});

export default router;