// tingwuService.js
// 阿里云通义听悟API服务

import Tingwu from '@alicloud/tingwu20230930';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import BaseService from './BaseService.js';
import configService from '../config/configService.js';
import { ConfigError, AppError, ServiceError } from '../utils/errors.js';
import cacheService from './cacheService.js';

/**
 * 通义听悟服务类
 * 封装通义听悟API的调用方法
 */
class TingwuService extends BaseService {
  constructor() {
    super('TingwuService');
    
    // 检查必要的配置项
    try {
      const requiredConfig = ['aliyun.accessKeyId', 'aliyun.accessKeySecret'];
      const validation = configService.validateRequiredConfig(requiredConfig);
      
      if (!validation.isValid) {
        throw new ConfigError(
          `缺少阿里云AccessKey配置: ${validation.missingKeys.join(', ')}`,
          500,
          { missingKeys: validation.missingKeys }
        );
      }
    } catch (error) {
      this.logger.error('初始化配置错误', error);
      throw error;
    }
    
    // 初始化通义听悟SDK客户端
    this.client = this.createClient();
    this.appKey = configService.get('aliyun.tingwu.appKey', 'ZuTDHhX19DqHnIut');
    
    this.logger.info('通义听悟服务已初始化');
  }

  /**
   * 创建阿里云通义听悟客户端
   * @returns {Object} 通义听悟客户端实例
   */
  createClient() {
    // 配置阿里云OpenAPI客户端
    const config = new OpenApi.Config({
      // 您的AccessKey ID
      accessKeyId: configService.get('aliyun.accessKeyId'),
      // 您的AccessKey Secret
      accessKeySecret: configService.get('aliyun.accessKeySecret'),
      // 访问的区域ID
      regionId: configService.get('aliyun.tingwu.regionId', 'cn-beijing'),
      // 访问的域名
      endpoint: configService.get('aliyun.tingwu.endpoint', 'tingwu.cn-beijing.aliyuncs.com')
    });
    
    // 创建通义听悟客户端实例
    return new Tingwu.default(config);
  }

  /**
   * 创建转录任务
   * @param {Object} options - 转录任务配置
   * @param {string} options.fileUrl - 文件URL（与OSS对象键二选一）
   * @param {string} options.ossObjectKey - OSS对象键（与文件URL二选一）
   * @param {string} options.ossBucket - OSS存储桶
   * @param {string} [options.taskKey] - 任务自定义标识
   * @param {string} [options.name] - 任务名称
   * @param {string} [options.sourceLanguage] - 音频源语言，默认为'cn'
   * @param {string} [options.type] - 任务类型，默认为'offline'
   * @returns {Promise<Object>} 任务创建结果
   */
  async createTranscriptionTask(options) {
    return this.executeWithErrorHandling(async () => {
      // 检查必要参数
      if (!options.input.fileUrl) {
        throw new AppError('缺少必要参数：需要提供文件URL或OSS对象信息', 400);
      }

      // 检查是否有缓存的相似任务
      const fileUrl = options.input.fileUrl;
      const cacheKey = `tingwu:task:${this.hashString(fileUrl)}`;
      const cachedTask = cacheService.get(cacheKey);
      
      if (cachedTask) {
        this.logger.info(`找到缓存的转录任务: ${cachedTask.taskId}`);
        return cachedTask;
      }

      // 创建input对象
      const input = new Tingwu.CreateTaskRequestInput({
        ...options.input
      });

      const parameters = new Tingwu.CreateTaskRequestParameters({
        ...options.parameters
      });

      // 创建CreateTaskRequest对象
      const createTaskRequest = new Tingwu.CreateTaskRequest({
        appKey: this.appKey,
        input: input,
        parameters: parameters
      });

      this.logger.debug("创建任务请求对象", createTaskRequest);

      createTaskRequest.type = options.type || 'offline';
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      this.logger.debug("转录任务请求详情:", JSON.stringify(createTaskRequest, null, 2));
      
      try {
        // 调用API创建任务
        const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
        this.logger.info("成功创建通义听悟任务:", response.body);
        
        // 缓存任务结果，保留1小时
        if (response.body.code === '0') {
          const taskResult = {
            taskId: response.body.data.taskId,
            taskStatus: response.body.data.taskStatus,
            fileUrl,
            createdAt: new Date().toISOString()
          };
          cacheService.set(cacheKey, taskResult, 60 * 60 * 1000); // 1小时
          
          // 也以任务ID为键缓存
          cacheService.set(`tingwu:taskId:${response.body.data.taskId}`, taskResult, 60 * 60 * 1000);
        }
        
        return response.body;
      } catch (error) {
        this.logger.error("创建通义听悟任务失败:", error);
        throw new ServiceError(`创建转录任务失败: ${error.message}`, 500, {
          originalError: error,
          options
        });
      }
    }, [], "创建通义听悟任务失败");
  }

  /**
   * 查询任务状态和结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 任务状态和结果
   */
  async getTaskResult(taskId) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      this.validateRequiredParams({ taskId }, ['taskId']);
      
      // 检查缓存中是否有完成的任务结果
      const cacheKey = `tingwu:result:${taskId}`;
      const cachedResult = cacheService.get(cacheKey);
      
      if (cachedResult && cachedResult.data?.taskStatus === 'COMPLETED') {
        this.logger.info(`使用缓存的任务结果: ${taskId}`);
        return cachedResult;
      }
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      try {
        // 调用API获取任务信息
        const response = await this.client.getTaskInfoWithOptions(taskId, headers, runtime);
        this.logger.info("成功获取通义听悟任务结果:", response.body);
        
        // 如果任务完成，缓存结果（保留24小时）
        if (response.body.data?.taskStatus === 'COMPLETED') {
          cacheService.set(cacheKey, response.body, 24 * 60 * 60 * 1000); // 24小时
        }
        
        return response.body;
      } catch (error) {
        this.logger.error("获取通义听悟任务结果失败:", error);
        throw new ServiceError(`获取任务结果失败: ${error.message}`, 500, {
          originalError: error,
          taskId
        });
      }
    }, [], "获取通义听悟任务结果失败");
  }

  /**
   * 创建热词表
   * @param {Object} options - 热词表参数
   * @param {string} options.name - 热词表名称
   * @param {string[]} options.words - 热词列表
   * @returns {Promise<Object>} 创建结果
   */
  async createVocabulary(options) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      this.validateRequiredParams(options, ['name', 'words']);
      
      // 检查缓存中是否已存在相同的热词表
      const cacheKey = `tingwu:vocabulary:${options.name}`;
      const cachedVocabulary = cacheService.get(cacheKey);
      
      if (cachedVocabulary) {
        this.logger.info(`使用缓存的热词表: ${options.name}`);
        return cachedVocabulary;
      }
      
      // 构建请求
      const createRequest = new Tingwu.CreateTranscriptionPhrasesRequest({
        name: options.name,
        words: options.words
      });

      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      try {
        // 调用API创建热词表
        const response = await this.client.createTranscriptionPhrasesWithOptions(createRequest, headers, runtime);
        this.logger.info("成功创建热词表:", response.body);
        
        // 缓存热词表（保留7天）
        cacheService.set(cacheKey, response.body, 7 * 24 * 60 * 60 * 1000); // 7天
        
        return response.body;
      } catch (error) {
        this.logger.error("创建热词表失败:", error);
        throw new ServiceError(`创建热词表失败: ${error.message}`, 500, {
          originalError: error,
          options
        });
      }
    }, [], "创建热词表失败");
  }

  /**
   * 创建实时转录任务
   * @param {Object} options - 实时转录任务配置
   * @param {string} options.sourceLanguage - 音频源语言，如'cn'或'en'
   * @param {string} options.format - 音频格式，如'pcm'、'opus'等
   * @param {string} options.sampleRate - 采样率，如'16000'或'8000'
   * @param {boolean} [options.translationEnabled] - 是否启用翻译
   * @param {Array} [options.targetLanguages] - 目标翻译语言数组
   * @returns {Promise<Object>} 任务创建结果
   */
  async createRealtimeTask(options) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      this.validateRequiredParams(options, ['sourceLanguage', 'format', 'sampleRate']);
      
      // 创建请求参数
      const input = new Tingwu.CreateTaskRequestInput({
        sourceLanguage: options.sourceLanguage,
        format: options.format,
        sampleRate: options.sampleRate,
        taskKey: options.taskKey || `realtime-${Date.now()}`,
      });

      // 创建参数配置
      const parameters = new Tingwu.CreateTaskRequestParameters({});
      
      // 设置转录参数
      parameters.transcription = {
        outputLevel: options.outputLevel || 2,  // 2表示返回中间结果
        diarizationEnabled: options.diarizationEnabled || false
      };
      
      // 如果启用说话人分离，设置说话人数量
      if (options.diarizationEnabled && options.speakerCount) {
        parameters.transcription.diarization = {
          speakerCount: options.speakerCount
        };
      }
      
      // 如果启用翻译
      if (options.translationEnabled) {
        parameters.translationEnabled = true;
        parameters.translation = {
          outputLevel: options.outputLevel || 2,
          targetLanguages: options.targetLanguages || ['cn']
        };
      }
      
      // 创建CreateTaskRequest对象
      const createTaskRequest = new Tingwu.CreateTaskRequest({
        appKey: this.appKey,
        input: input,
        parameters: parameters,
        type: 'realtime'  // 设置为实时任务类型
      });
      
      this.logger.info("创建实时任务请求对象", createTaskRequest);
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      try {
        // 调用API创建任务
        const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
        this.logger.info("成功创建通义听悟实时任务:", response.body);
        
        // 缓存任务结果
        if (response.body.code === '0') {
          const taskResult = {
            taskId: response.body.data.taskId,
            taskStatus: response.body.data.taskStatus,
            createdAt: new Date().toISOString()
          };
          
          // 以任务ID为键缓存
          cacheService.set(`tingwu:realtime:${response.body.data.taskId}`, taskResult, 24 * 60 * 60 * 1000); // 24小时
        }
        
        return response.body;
      } catch (error) {
        this.logger.error("创建通义听悟实时任务失败:", error);
        throw new ServiceError(`创建实时转录任务失败: ${error.message}`, 500, {
          originalError: error,
          options
        });
      }
    }, [], "创建通义听悟实时任务失败");
  }

  /**
   * 停止实时转录任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 停止任务结果
   */
  async stopRealtimeTask(taskId) {
    return this.executeWithErrorHandling(async () => {
      // 参数验证
      this.validateRequiredParams({ taskId }, ['taskId']);
      
      // 获取缓存的任务信息
      const cacheKey = `tingwu:realtime:${taskId}`;
      const cachedTask = cacheService.get(cacheKey);
      
      if (!cachedTask) {
        this.logger.warn(`未找到实时任务缓存: ${taskId}`);
      }
      
      try {
        // 设置运行时选项和请求头
        const runtime = new Util.RuntimeOptions({});
        const headers = {};
        
        // 根据API文档，正确构建停止任务请求
        // 需要完整的请求结构，包括input对象
        const createTaskRequest = new Tingwu.CreateTaskRequest({
          appKey: this.appKey,
          input: {
            taskId: taskId // 在input中设置taskId
          },
          parameters: {}, // 需要提供空的parameters对象
          type: 'realtime',
          operation: 'stop' // 操作类型为停止
        });
        
        this.logger.info("停止任务请求参数:", JSON.stringify(createTaskRequest, null, 2));
        
        // 调用API停止任务
        const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
        this.logger.info("成功停止通义听悟实时任务:", response.body);
        
        // 清除任务缓存
        if (cachedTask) {
          cacheService.delete(cacheKey);
        }
        
        return response.body;
      } catch (error) {
        this.logger.error("停止通义听悟实时任务失败:", error);
        throw new ServiceError(`停止实时转录任务失败: ${error.message}`, 500, {
          originalError: error,
          taskId
        });
      }
    }, [], "停止通义听悟实时任务失败");
  }

  /**
   * 计算字符串的简单哈希值
   * @param {string} str - 输入字符串
   * @returns {string} 哈希值
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash.toString(16);
  }
}

// 创建单例实例
const tingwuService = new TingwuService();

export default tingwuService;
