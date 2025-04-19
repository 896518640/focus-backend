// auth.js
// 用户认证相关路由配置

import express from 'express';
import authController from '../../controllers/authController.js';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { loginValidation, registerValidation } from '../../middlewares/validationMiddleware.js';
import { registerRoutes, createRouteHelper } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';

const logger = createLogger('AuthRoutes');
const router = express.Router();

// 创建认证控制器助手，包装控制器方法并提供统一的错误处理
const handler = createRouteHelper(authController);

// 定义路由配置，集中管理所有认证相关路由
const routes = [
  // 登录路由
  { 
    path: '/login', 
    method: 'post', 
    handler: handler.login, 
    middlewares: [loginValidation],
    description: '用户登录'
  },
  
  // 注册路由
  { 
    path: '/register', 
    method: 'post', 
    handler: handler.register, 
    middlewares: [registerValidation],
    description: '用户注册'
  },
  
  // 获取当前用户信息
  { 
    path: '/me', 
    method: 'get', 
    handler: handler.getCurrentUser, 
    middlewares: [authenticate],
    description: '获取当前用户信息'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('认证路由模块已加载');

export default router;