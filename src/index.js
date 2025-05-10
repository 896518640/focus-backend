import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import config, { validateConfig } from './config/index.js';
import createLogger from './utils/logger.js';
import apiV1Routes from './routes/v1/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import errorHandler from './middlewares/errorHandler.js';
import { setupSwagger } from './utils/swagger.js';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = createLogger('App');

// 验证配置
const configValidation = validateConfig();
if (!configValidation.isValid) {
  logger.error('配置验证失败!');
  Object.entries(configValidation.missingConfigs).forEach(([service, missingKeys]) => {
    logger.error(`服务 ${service} 缺少以下环境变量: ${missingKeys.join(', ')}`);
  });
  logger.warn('应用可能无法正常工作，请检查环境变量配置');
}

// 创建Express应用
const app = express();

// 创建HTTP服务器
const server = createServer(app);

// 配置中间件
app.use(express.json()); // 解析JSON请求体
app.use(express.urlencoded({ extended: true })); // 解析URL编码的请求体

// 配置CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', config.server.cors.origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// 设置静态文件服务
app.use('/uploads', express.static(path.join(process.cwd(), 'tmp', 'uploads')));
app.use('/public', express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(process.cwd(), 'public'))); // 直接访问根路径可以访问public下的文件

// 根路由 - 如果静态文件服务未处理则发送首页
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// 配置Swagger API文档（仅在非生产环境中启用）
if (process.env.NODE_ENV !== 'production') {
  setupSwagger(app);
  logger.info('API文档已启用，访问路径: /api-docs');
}


// 注册API路由
app.use('/api/v1', apiV1Routes);

// API健康检查路由
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      rtasr: config.speech.rtasr.appId ? 'available' : 'unavailable',
      iflytek: config.speech.iflytek.appId && config.speech.iflytek.apiSecret ? 'available' : 'unavailable',
      auth: 'available'
    }
  });
});

// 404处理
app.use((req, res) => {
  logger.warn(`404 - 未找到资源: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

// 全局错误处理中间件
app.use(errorHandler);

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error('未捕获的异常:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

// 启动服务器
const port = config.server.port;
server.listen(port, () => {
  logger.info(`服务器已启动，端口: ${port}`);
  logger.info(`网站首页: http://localhost:${port}/`);
  logger.info(`健康检查API: http://localhost:${port}/health`);
  logger.info(`API文档: http://localhost:${port}/api-docs`);
});