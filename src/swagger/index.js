/**
 * Swagger配置入口文件
 * 整合所有API定义
 */

import tingwuSchemas from './schemas/tingwu.js';
import tingwuPaths from './paths/tingwu.js';

export default {
  openapi: '3.0.0',
  info: {
    title: 'Focus Backend API',
    version: '1.0.0',
    description: '语音识别及翻译后端服务 API 文档'
  },
  tags: [
    {
      name: '通义听悟',
      description: '音频识别与转录相关API'
    }
    // 可以添加其他标签
  ],
  paths: {
    ...tingwuPaths,
    // 其他路径可以在这里添加
  },
  components: {
    schemas: {
      ...tingwuSchemas,
      // 其他模型可以在这里添加
    }
  }
}; 