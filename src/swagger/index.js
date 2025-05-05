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
import userSchemas from './schemas/user.js';
import authSchemas from './schemas/auth.js';
import { userPaths } from './paths/user.js';
import { authPaths } from './paths/auth.js';

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
    },
    {
      name: '用户管理',
      description: '用户资料、活动和设置管理相关API'
    },
    {
      name: '认证',
      description: '用户认证、登录和注册相关API'
    }
    // 可以添加其他标签
  ],
  paths: {
    ...tingwuPaths,
    ...translationPaths,
    ...openaiPaths,
    ...userPaths,
    ...authPaths,
    // 其他路径可以在这里添加
  },
  components: {
    schemas: {
      ...tingwuSchemas,
      ...translationSchemas,
      ...openaiSchemas,
      ...userSchemas,
      ...authSchemas,
      // 其他模型可以在这里添加
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
}; 