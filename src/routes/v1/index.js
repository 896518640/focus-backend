// index.js
// API 主路由配置文件

import express from 'express';
import userRoutes from './userRoutes.js';
import mainTingwuRoutes from './mainTingwuRoutes.js';
import translationRoutes from './translationRoutes.js';
import openaiRoutes from './openaiRoutes.js';
import createLogger from '../../utils/logger.js';
import { formatResponse } from '../../utils/responseFormatter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createLogger('APIRoutes');
const router = express.Router();

// 注册子路由模块
router.use('/user', userRoutes);
router.use('/tingwu', mainTingwuRoutes);
router.use('/translation', translationRoutes);
router.use('/openai', openaiRoutes);

// 定义主路由配置
const routes = [
  // API状态检查路由
  { 
    path: '/status', 
    method: 'get', 
    handler: (req, res) => {
      logger.info('API状态检查');
      res.json(formatResponse(0, 'API服务正常', {
        timestamp: new Date().toISOString(),
        version: 'v1'
      }));
    },
    description: 'API服务状态检查'
  }
];

// 批量注册路由
import { registerRoutes } from '../../utils/routeHelper.js';
registerRoutes(router, routes);

logger.info('API主路由模块已加载');

// 添加404处理中间件
router.use((req, res) => {
  logger.warn(`API路由未找到: ${req.method} ${req.path}`);
  res.status(404).json(formatResponse(404, '请求的API接口不存在', { path: req.path }));
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 自动注册所有路由模块
 * @param {express.Application} app - Express应用实例
 * @param {string} prefix - API路由前缀
 */
const registerAllRoutes = (app, prefix) => {
  try {
    // 已经明确注册的路由模块名称
    const explicitlyRegisteredRoutes = [
      'user',
      'tingwu',
      'translation',
      'openai'
    ];
    
    const routeFiles = fs.readdirSync(__dirname)
      .filter(file => 
        file.endsWith('Routes.js') && 
        file !== 'index.js' && 
        // 排除简化通义听悟路由，因为它会单独注册
        file !== 'simpleTingwuRoutes.js' &&
        // 排除已经明确注册的路由模块
        !explicitlyRegisteredRoutes.some(route => 
          file.toLowerCase() === `${route}Routes.js`.toLowerCase()
        )
      );
    
    for (const file of routeFiles) {
      const routeName = file.replace('Routes.js', '');
      
      // 动态导入路由模块
      import(`./${file}`)
        .then(module => {
          const router = module.default;
          const routePath = `${prefix}/${routeName.toLowerCase()}`;
          
          // 注册路由
          app.use(routePath, router);
          logger.info(`已注册路由: ${routePath}`);
        })
        .catch(err => {
          logger.error(`导入路由模块失败 [${file}]:`, err);
        });
    }
    
    logger.info(`共扫描到 ${routeFiles.length} 个路由模块`);
  } catch (error) {
    logger.error('注册路由时出错:', error);
  }
};

export { registerAllRoutes };

export default router;