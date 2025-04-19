// app.js
// 应用程序初始化和配置

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import serviceContainer from './utils/serviceContainer.js';
import configService from './config/configService.js';
import createLogger from './utils/logger.js';
import cacheService from './services/cacheService.js';
import { registerAllRoutes } from './routes/v1/index.js';
import { handleError } from './middlewares/errorHandler.js';

const logger = createLogger('App');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 应用程序类
 * 负责初始化Express应用、中间件和路由
 */
class App {
  constructor() {
    this.app = express();
    this.logger = logger;
    
    // 应用配置
    this.config = {
      port: configService.get('server.port', 3000),
      env: configService.get('app.env', 'development'),
      logLevel: configService.get('app.logLevel', 'info'),
      uploadDir: configService.get('storage.uploadDir', path.join(process.cwd(), 'tmp', 'uploads')),
    };
    
    this.logger.info('应用程序初始化中...');
    
    // 初始化阶段
    this.initServiceContainer();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
    
    this.logger.info('应用程序初始化完成');
  }
  
  /**
   * 初始化服务容器，注册所有服务
   */
  initServiceContainer() {
    // 注册配置服务
    serviceContainer.register('configService', configService);
    
    // 注册缓存服务
    serviceContainer.register('cacheService', cacheService);
    
    // 动态导入并注册其他服务
    this.registerServices();
    
    this.logger.info(`服务容器初始化完成，已注册服务: ${serviceContainer.getServiceNames().join(', ')}`);
  }
  
  /**
   * 注册所有服务到服务容器
   */
  async registerServices() {
    try {
      // 导入服务模块
      const { default: fileUploadService } = await import('./services/fileUploadService.js');
      const { default: transcriptionService } = await import('./services/transcriptionService.js');
      const { default: tingwuService } = await import('./services/tingwuService.js');
      const { default: userService } = await import('./services/userService.js');
      const { default: authService } = await import('./services/authService.js');
      
      // 注册到服务容器
      serviceContainer.register('fileUploadService', fileUploadService);
      serviceContainer.register('transcriptionService', transcriptionService);
      serviceContainer.register('tingwuService', tingwuService);
      serviceContainer.register('userService', userService);
      serviceContainer.register('authService', authService);
      
    } catch (error) {
      this.logger.error('注册服务失败', error);
      throw error;
    }
  }
  
  /**
   * 设置Express中间件
   */
  setupMiddlewares() {
    // 解析JSON和URL编码的请求
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
    
    // 启用CORS
    this.app.use(cors({
      origin: configService.get('cors.origin', '*'),
      methods: configService.get('cors.methods', 'GET,HEAD,PUT,PATCH,POST,DELETE'),
      credentials: configService.get('cors.credentials', true)
    }));
    
    // 安全头信息
    this.app.use(helmet());
    
    // 请求日志
    const morganFormat = this.config.env === 'production' ? 'combined' : 'dev';
    this.app.use(morgan(morganFormat, {
      skip: (req, res) => this.config.env === 'production' && res.statusCode < 400,
      stream: { write: message => this.logger.http(message.trim()) }
    }));
    
    // 静态文件目录
    this.app.use('/uploads', express.static(this.config.uploadDir));
    this.app.use('/public', express.static(path.join(process.cwd(), 'public')));
    
    // 请求时间记录中间件
    this.app.use((req, res, next) => {
      req.startTime = Date.now();
      
      // 请求完成后记录耗时
      res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        if (duration > configService.get('performance.slowRequestThreshold', 1000)) {
          this.logger.warn(`慢请求: ${req.method} ${req.originalUrl} - ${duration}ms`);
        }
      });
      
      next();
    });
    
    this.logger.info('中间件设置完成');
  }
  
  /**
   * 设置应用路由
   */
  setupRoutes() {
    // API版本前缀
    const apiPrefix = configService.get('api.prefix', '/api/v1');
    
    // 健康检查路由
    this.app.get('/health', (req, res) => {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      const cacheStats = cacheService.getStats();
      
      res.status(200).json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        },
        cache: cacheStats
      });
    });
    
    // 注册所有API路由
    registerAllRoutes(this.app, apiPrefix);
    
    // 404处理
    this.app.use((req, res) => {
      res.status(404).json({
        status: 'error',
        message: `未找到路由: ${req.originalUrl}`
      });
    });
    
    this.logger.info(`路由设置完成，API前缀: ${apiPrefix}`);
  }
  
  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 全局错误处理中间件
    this.app.use(handleError);
    this.logger.info('错误处理中间件设置完成');
  }
  
  /**
   * 启动应用服务器
   */
  start() {
    const port = this.config.port;
    
    return new Promise((resolve) => {
      const server = this.app.listen(port, () => {
        this.logger.info(`服务器已启动，监听端口: ${port}，环境: ${this.config.env}`);
        resolve(server);
      });
      
      // 处理未捕获的Promise拒绝
      process.on('unhandledRejection', (reason, promise) => {
        this.logger.error('未捕获的Promise拒绝:', reason);
      });
      
      // 处理未捕获的异常
      process.on('uncaughtException', (error) => {
        this.logger.error('未捕获的异常:', error);
        
        // 在生产环境下，遇到未捕获的异常可能应该优雅地关闭应用
        if (this.config.env === 'production') {
          this.logger.error('遇到致命错误，应用将在5秒后关闭');
          setTimeout(() => {
            process.exit(1);
          }, 5000);
        }
      });
      
      // 应用关闭时的清理工作
      const gracefulShutdown = () => {
        this.logger.info('正在关闭应用...');
        
        // 清理缓存服务
        cacheService.destroy();
        
        server.close(() => {
          this.logger.info('应用已成功关闭');
          process.exit(0);
        });
        
        // 如果10秒内没有成功关闭，强制退出
        setTimeout(() => {
          this.logger.error('应用关闭超时，强制退出');
          process.exit(1);
        }, 10000);
      };
      
      // 监听终止信号
      process.on('SIGTERM', gracefulShutdown);
      process.on('SIGINT', gracefulShutdown);
    });
  }
  
  /**
   * 获取Express应用实例
   * @returns {Object} Express应用实例
   */
  getApp() {
    return this.app;
  }
}

export default App;
