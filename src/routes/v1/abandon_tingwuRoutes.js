// tingwuRoutes.js
// 通义听悟相关路由配置

import express from 'express';
import tingwuController from '../../controllers/tingwuController.js';
import multer from 'multer';
import { createRouteHelper, registerRoutes } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';
// import { authenticate } from '../../middlewares/authMiddleware.js';

const logger = createLogger('TingwuRoutes');
const router = express.Router();

// 使用路由助手包装控制器方法
const handler = createRouteHelper(tingwuController);

// 配置文件上传中间件
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 限制文件大小为100MB
  },
});

// 开发测试阶段暂时禁用认证
// router.use(authenticate);

// 定义路由配置
const routes = [
  { 
    path: '/upload', 
    method: 'post', 
    handler: handler.uploadFile, 
    middlewares: [upload.single('audio')],
    description: '上传音频文件'
  },
  { 
    path: '/tasks', 
    method: 'post', 
    handler: handler.createTask,
    description: '创建转写任务'
  },
  { 
    path: '/tasks/:taskId', 
    method: 'get', 
    handler: handler.getTaskInfo,
    description: '获取任务信息'
  },
  { 
    path: '/tasks/:taskId/poll', 
    method: 'get', 
    handler: handler.pollTaskResult,
    description: '轮询任务结果'
  },
  { 
    path: '/fetch-json', 
    method: 'post', 
    handler: handler.fetchJsonContent,
    description: '获取JSON内容'
  },
  { 
    path: '/vocabularies', 
    method: 'post', 
    handler: handler.createVocabulary,
    description: '创建词汇表'
  },
  // 以下是新增的实时翻译相关路由
  { 
    path: '/realtime/start', 
    method: 'post', 
    handler: handler.startRealtimeTask,
    description: '创建实时翻译任务'
  },
  { 
    path: '/realtime/:taskId/stop', 
    method: 'post', 
    handler: handler.stopRealtimeTask,
    description: '停止实时翻译任务'
  },
  { 
    path: '/realtime/:taskId/result', 
    method: 'get', 
    handler: handler.getRealtimeTaskResult,
    description: '获取实时翻译任务结果'
  },
  { 
    path: '/realtime/websocket', 
    method: 'get', 
    handler: handler.getWebSocketInfo,
    description: '获取WebSocket连接信息'
  }
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('通义听悟路由模块已加载');

export default router;