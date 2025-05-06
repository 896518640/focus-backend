import { PrismaClient } from '@prisma/client';
import createLogger from '../utils/logger.js';

const logger = createLogger('PrismaService');

// 创建全局单例以防止在开发时创建多个实例
const globalForPrisma = global;

/**
 * 获取一个调试选项配置的 PrismaClient
 */
function createPrismaClient() {
  try {
    return new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ],
    });
  } catch (error) {
    logger.error('创建 PrismaClient 失败:', error);
    
    // 回退到没有日志配置的简单实例
    try {
      return new PrismaClient();
    } catch (fallbackError) {
      logger.error('创建无日志 PrismaClient 也失败:', fallbackError);
      throw fallbackError;
    }
  }
}

// 保持单例模式
const prisma = globalForPrisma.prisma || createPrismaClient();

// 添加日志事件
try {
  prisma.$on('query', (e) => {
    logger.debug(`查询: ${e.query}`);
  });

  prisma.$on('error', (e) => {
    logger.error(`数据库错误: ${e.message}`);
  });

  prisma.$on('info', (e) => {
    logger.info(`数据库信息: ${e.message}`);
  });

  prisma.$on('warn', (e) => {
    logger.warn(`数据库警告: ${e.message}`);
  });
  
  logger.info('Prisma 客户端初始化成功，已设置事件监听器');
} catch (error) {
  logger.warn('设置 Prisma 事件监听器失败 (可能是正常的):', error.message);
}

// 在非生产环境下，将 prisma 保存到全局变量，防止热重载时创建多个连接
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma; 

