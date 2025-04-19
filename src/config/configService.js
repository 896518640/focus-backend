// configService.js
// 集中式配置管理服务，统一管理所有环境变量和配置项

import dotenv from 'dotenv';
import path from 'path';
import createLogger from '../utils/logger.js';
import { fileURLToPath } from 'url';
import fs from 'fs';

// 获取当前文件的目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 集中式配置管理服务
 * 负责加载、验证和提供应用配置
 */
class ConfigService {
  constructor() {
    this.logger = createLogger('ConfigService');
    this.config = {};
    this.isLoaded = false;

    // 加载环境变量
    this._loadEnvVariables();
    
    // 初始化配置
    this._initializeConfig();
  }

  /**
   * 加载环境变量
   * @private
   */
  _loadEnvVariables() {
    try {
      // 尝试加载.env文件
      const envPath = path.resolve(process.cwd(), '.env');
      
      if (fs.existsSync(envPath)) {
        const result = dotenv.config({ path: envPath });
        if (result.error) {
          this.logger.warn(`加载.env文件失败: ${result.error.message}`);
        } else {
          this.logger.info('.env文件加载成功');
        }
      } else {
        this.logger.warn('.env文件不存在，将使用环境变量');
      }
    } catch (error) {
      this.logger.error('加载环境变量出错:', error);
    }
  }

  /**
   * 初始化配置
   * @private
   */
  _initializeConfig() {
    // 服务器配置
    this.config.server = {
      port: parseInt(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost',
      nodeEnv: process.env.NODE_ENV || 'development',
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
      },
      baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,
    };

    // 阿里云配置
    this.config.aliyun = {
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      oss: {
        region: process.env.ALIYUN_OSS_REGION || 'oss-cn-beijing',
        bucket: process.env.ALIYUN_OSS_BUCKET || 'focus-01',
        timeout: parseInt(process.env.ALIYUN_OSS_TIMEOUT) || 60000,
      },
      tingwu: {
        appKey: process.env.ALIYUN_TINGWU_APP_KEY || 'ZuTDHhX19DqHnIut',
        endpoint: process.env.ALIYUN_TINGWU_ENDPOINT || 'tingwu.cn-beijing.aliyuncs.com',
        regionId: process.env.ALIYUN_TINGWU_REGION_ID || 'cn-beijing',
      }
    };

    // JWT配置
    this.config.jwt = {
      secret: process.env.JWT_SECRET || 'speakflow-secret-key',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    };

    // 文件存储配置
    this.config.storage = {
      useLocalFiles: process.env.USE_LOCAL_FILES === 'true',
      uploadDir: path.join(process.cwd(), 'tmp', 'uploads'),
    };
    
    // 标记配置已加载
    this.isLoaded = true;
    this.logger.info('配置初始化完成');
  }

  /**
   * 获取特定配置项
   * @param {string} key - 配置键名，使用点号分隔，如'server.port'
   * @param {*} defaultValue - 默认值，当配置项不存在时返回
   * @returns {*} 配置值
   */
  get(key, defaultValue = undefined) {
    if (!this.isLoaded) {
      this.logger.warn('尝试在配置加载前访问配置项');
      return defaultValue;
    }

    const keys = key.split('.');
    let value = this.config;
    
    for (const k of keys) {
      if (value === undefined || value === null) {
        return defaultValue;
      }
      value = value[k];
    }
    
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 验证是否存在必要的配置项
   * @param {string[]} requiredKeys - 必需的配置键数组，使用点号分隔
   * @returns {Object} 验证结果，包含是否有效和缺失的配置项
   */
  validateRequiredConfig(requiredKeys) {
    const missingKeys = [];
    
    for (const key of requiredKeys) {
      if (this.get(key) === undefined) {
        missingKeys.push(key);
      }
    }
    
    return {
      isValid: missingKeys.length === 0,
      missingKeys
    };
  }

  /**
   * 获取完整配置对象
   * @returns {Object} 完整配置对象
   */
  getAll() {
    return { ...this.config };
  }
}

// 创建单例实例
const configService = new ConfigService();

export default configService;
