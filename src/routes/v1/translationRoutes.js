// translationRoutes.js
// 翻译记录相关路由

import express from 'express';
import translationController from '../../controllers/translationController.js';
import { createRouteHelper, registerRoutes, createHandler } from '../../utils/routeHelper.js';
import createLogger from '../../utils/logger.js';
import { authenticate } from '../../middlewares/authMiddleware.js';

const logger = createLogger('TranslationRoutes');
const router = express.Router();

// 使用路由助手包装控制器方法
const handler = createRouteHelper(translationController);

// 使用认证中间件
router.use(authenticate);

// 为流式总结单独配置路由
// 注意：流式API不使用路由助手，因为它需要直接控制响应流
router.post('/summarize', createHandler(translationController.streamingSummarize));

// 定义路由配置
const routes = [
  { 
    path: '/save', 
    method: 'post', 
    handler: handler.saveTranslation,
    description: '保存翻译记录'
  },
  { 
    path: '/list', 
    method: 'get', 
    handler: handler.getTranslationList,
    description: '获取翻译记录列表'
  },
  { 
    path: '/detail/:id', 
    method: 'get', 
    handler: handler.getTranslationDetail,
    description: '获取翻译记录详情'
  },
  { 
    path: '/delete/:id', 
    method: 'delete', 
    handler: handler.deleteTranslation,
    description: '删除翻译记录'
  },
];

// 批量注册路由
registerRoutes(router, routes);

logger.info('翻译记录路由模块已加载');

export default router; 