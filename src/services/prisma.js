import { PrismaClient } from '@prisma/client';
import createLogger from '../utils/logger.js';

const logger = createLogger('PrismaService');

// 创建Prisma客户端实例
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// 添加日志事件
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

export default prisma; 