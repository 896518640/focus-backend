// openaiRoutes.js
// OpenAI/OpenRouter API 相关路由

import express from 'express';
import openaiController from '../../controllers/openaiController.js';
import { createRouteHelper, registerRoutes } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const logger = createLogger('OpenAIRoutes');
const router = express.Router();

// 使用路由助手包装控制器方法
const handler = createRouteHelper(openaiController);

// 使用认证中间件
router.use(authenticate);

// 定义路由配置
const routes = [
  { 
    path: '/chat', 
    method: 'post', 
    handler: handler.createChatCompletion,
    description: '创建聊天完成'
  },
  { 
    path: '/completion', 
    method: 'post', 
    handler: handler.createCompletion,
    description: '创建文本完成'
  },
  { 
    path: '/config', 
    method: 'get', 
    handler: handler.getConfig,
    description: '获取OpenAI配置信息'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('OpenAI路由模块已加载');

export default router; 