// simpleTingwuRoutes.js
// 简化版通义听悟路由 - 只提供两个核心接口

import express from 'express';
import tingwuController from '../../controllers/tingwuController.js';
import { createRouteHelper, registerRoutes } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const logger = createLogger('MainTingwuRoutes');
const router = express.Router();

// 使用路由助手包装控制器方法
const handler = createRouteHelper(tingwuController);

// 开发测试阶段暂时禁用认证
router.use(authenticate);

// 定义路由配置 - 只包含创建任务和获取任务信息两个接口
const routes = [
  { 
    path: '/tasks', 
    method: 'post', 
    handler: handler.createTask,
    description: '创建通义听悟任务 (CreateTask API)'
  },
  { 
    path: '/tasks/:taskId', 
    method: 'get', 
    handler: handler.getTaskInfo,
    description: '获取通义听悟任务信息 (GetTaskInfo API)'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('通用通义听悟路由模块已加载');

export default router; 