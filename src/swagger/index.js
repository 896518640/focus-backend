/**
 * Swagger配置入口文件
 * 整合所有API定义
 */

import tingwuSchemas from './schemas/tingwu.js';
import tingwuPaths from './paths/tingwu.js';
import translationSchemas from './schemas/translation.js';
import translationPaths from './paths/translation.js';
import * as openaiSchemas from './schemas/openai.js';
import { openaiPaths } from './paths/openai.js';

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
    },
    {
      name: '翻译管理',
      description: '翻译记录管理相关API'
    },
    {
      name: 'OpenAI API',
      description: 'OpenAI/OpenRouter 集成相关API'
    }
    // 可以添加其他标签
  ],
  paths: {
    ...tingwuPaths,
    ...translationPaths,
    ...openaiPaths,
    // 其他路径可以在这里添加
  },
  components: {
    schemas: {
      ...tingwuSchemas,
      ...translationSchemas,
      ...openaiSchemas,
      // 其他模型可以在这里添加
    }
  }
}; 