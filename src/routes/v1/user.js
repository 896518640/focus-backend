// user.js
// 用户相关路由配置

import express from 'express';
import { authenticate } from '../../middlewares/authMiddleware.js';
import * as userController from '../../controllers/userController.js';
import { registerRoutes, createFunctionHelper } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';

const logger = createLogger('UserRoutes');
const router = express.Router();

// 所有用户路由都需要验证token
router.use(authenticate);

// 创建用户控制器助手，包装所有方法以提供统一的错误处理
const handler = createFunctionHelper(userController);

// 定义路由配置，集中管理所有用户相关路由
const routes = [
  // 用户资料相关路由
  { 
    path: '/profile', 
    method: 'get', 
    handler: handler.getUserProfile,
    description: '获取用户个人资料' 
  },
  { 
    path: '/profile', 
    method: 'put', 
    handler: handler.updateUserProfile,
    description: '更新用户个人资料' 
  },
  
  // 用户活动记录相关路由
  { 
    path: '/activities', 
    method: 'get', 
    handler: handler.getUserActivities,
    description: '获取用户活动记录' 
  },
  { 
    path: '/activities', 
    method: 'post', 
    handler: handler.recordActivity,
    description: '记录用户活动' 
  },
  
  // 用户统计相关路由
  { 
    path: '/stats', 
    method: 'get', 
    handler: handler.getUserStats,
    description: '获取用户使用统计' 
  },
  
  // 用户设置相关路由
  { 
    path: '/settings', 
    method: 'put', 
    handler: handler.updateUserSettings,
    description: '更新用户设置' 
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('用户路由模块已加载');

export default router;
