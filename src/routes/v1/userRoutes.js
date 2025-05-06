// userRoutes.js
// 统一的用户路由模块，整合认证和用户管理功能

import express from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import { loginValidation, registerValidation } from '../../middlewares/validationMiddleware.js';
import { registerRoutes, createRouteHelper } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';

// 导入控制器方法
import authController from '../../controllers/authController.js';
import userController from '../../controllers/userController.js';

const logger = createLogger('UserRoutes');
const router = express.Router();

// 创建控制器助手，包装所有方法以提供统一的错误处理
const authHandler = createRouteHelper(authController);
const userHandler = createRouteHelper(userController);

// 定义路由配置，按功能分组管理所有用户相关路由
const routes = [
  // 认证路由组 (无需身份验证)
  { 
    path: '/auth/login', 
    method: 'post', 
    handler: authHandler.login, 
    middlewares: [loginValidation],
    description: '用户登录'
  },
  { 
    path: '/auth/register', 
    method: 'post', 
    handler: authHandler.register, 
    middlewares: [registerValidation],
    description: '用户注册'
  },
  
  // 用户信息路由组 (需要身份验证)
  { 
    path: '/me', 
    method: 'get', 
    handler: authHandler.getCurrentUser, 
    middlewares: [authenticate],
    description: '获取当前用户基本信息'
  },
  { 
    path: '/profile', 
    method: 'get', 
    handler: userHandler.getUserProfile, 
    middlewares: [authenticate],
    description: '获取用户完整资料(包含会员信息、功能设置、使用情况)'
  },
  { 
    path: '/profile', 
    method: 'put', 
    handler: userHandler.updateUserProfile, 
    middlewares: [authenticate],
    description: '更新用户基本资料'
  },
  
  // 功能设置路由组
  { 
    path: '/settings', 
    method: 'put', 
    handler: userHandler.updateUserSettings, 
    middlewares: [authenticate],
    description: '更新用户功能设置'
  },
  
  // 翻译功能开关
  { 
    path: '/settings/translation', 
    method: 'put', 
    handler: userHandler.toggleTranslation, 
    middlewares: [authenticate],
    description: '开启/关闭翻译功能'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('统一用户路由模块已加载');

export default router; 