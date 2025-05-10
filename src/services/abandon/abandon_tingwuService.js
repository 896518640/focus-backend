// tingwuService.js
// 阿里云通义听悟API服务

import Tingwu from '@alicloud/tingwu20230930';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import BaseService from '../BaseService.js';
import configService from '../../config/configService.js';
import { ConfigError, AppError, ServiceError } from '../../utils/errors.js';
import cacheService from '../cacheService.js';
import axios from 'axios';

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
    
    // 定义API调用次数的限制
    this.rateLimits = {
      createTask: {
        qps: 20,
        interval: 1000 // 1秒
      },
      getTaskInfo: {
        qps: 100,
        interval: 1000 // 1秒
      }
    };
    
    // 初始化API调用计数器
    this.apiCallCounters = {
      createTask: {
        count: 0,
        lastResetTime: Date.now()
      },
      getTaskInfo: {
        count: 0,
        lastResetTime: Date.now()
      }
    };
    
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
   * 通用创建任务方法 - 封装CreateTask API调用
   * 
   * @param {Object} options - 任务配置
   * @param {string} options.type - 任务类型: 'offline'(离线转录), 'realtime'(实时转录)
   * @param {Object} options.input - 输入参数
   * @param {Object} options.parameters - 任务参数
   * @param {string} [options.operation] - 操作类型，如'stop'用于停止实时任务
   * @param {string} [options.cacheKey] - 自定义缓存键，如果不提供则自动生成
   * @param {number} [options.cacheTTL] - 缓存时间(毫秒)，默认1小时
   * @returns {Promise<Object>} 任务创建结果
   */
  async createTask(options) {
    return this.executeWithErrorHandling(async () => {
      // 限流控制
      await this.checkRateLimit('createTask');
      
      // 检查必要参数
      if (!options.type || !options.input) {
        throw new AppError('缺少必要参数：type和input', 400);
      }

      // 检查缓存(如果有cacheKey且不是停止操作)
      if (options.cacheKey && options.operation !== 'stop') {
        const cachedTask = cacheService.get(options.cacheKey);
        if (cachedTask) {
          this.logger.info(`找到缓存的任务: ${options.cacheKey}`);
          return cachedTask;
        }
      }

      // 创建input对象 - 支持已经是SDK对象或普通对象
      let input = options.input;
      if (!(input instanceof Tingwu.CreateTaskRequestInput)) {
        input = new Tingwu.CreateTaskRequestInput({
          ...options.input
        });
      }

      // 创建parameters对象 - 支持已经是SDK对象或普通对象
      let parameters = options.parameters || {};
      if (!(parameters instanceof Tingwu.CreateTaskRequestParameters)) {
        parameters = new Tingwu.CreateTaskRequestParameters({
          ...parameters
        });
      }

      // 创建CreateTaskRequest对象
      const createTaskRequest = new Tingwu.CreateTaskRequest({
        appKey: this.appKey,
        input: input,
        parameters: parameters
      });

      // 设置任务类型和操作
      createTaskRequest.type = options.type;
      if (options.operation) {
        createTaskRequest.operation = options.operation;
      }
      
      this.logger.debug("创建任务请求对象", createTaskRequest);
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      try {
        // 调用API创建任务
        const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
        this.logger.info(`成功创建通义听悟任务 (类型: ${options.type}):`, response.body);
        
        // 缓存任务结果
        if (response.body.code === '0' && options.cacheKey && options.operation !== 'stop') {
          const taskResult = {
            ...response.body,
            _cached: true,
            _cachedAt: new Date().toISOString()
          };
          
          // 使用提供的cacheTTL或默认值
          const cacheTTL = options.cacheTTL || 60 * 60 * 1000; // 默认1小时
          cacheService.set(options.cacheKey, taskResult, cacheTTL);
          
          // 也以任务ID为键缓存
          const taskIdCacheKey = `tingwu:taskId:${response.body.data.taskId}`;
          cacheService.set(taskIdCacheKey, taskResult, cacheTTL);
        }
        
        return response.body;
      } catch (error) {
        this.logger.error(`创建通义听悟任务失败 (类型: ${options.type}):`, error);
        throw new ServiceError(`创建任务失败: ${error.message}`, 500, {
          originalError: error,
          options
        });
      }
    }, [], `创建通义听悟任务失败 (类型: ${options.type})`);
  }

  /**
   * 通用获取任务信息方法 - 封装GetTaskInfo API调用
   * 
   * @param {string} taskId - 任务ID
   * @param {Object} [options] - 额外选项
   * @param {string} [options.cacheKey] - 自定义缓存键，如果不提供则使用taskId
   * @param {number} [options.cacheTTL] - 缓存时间(毫秒)，默认对完成的任务24小时，进行中的任务5分钟
   * @param {boolean} [options.fetchResultContent] - 是否获取结果URL中的内容
   * @param {boolean} [options.forceFresh] - 是否强制忽略缓存获取最新数据
   * @returns {Promise<Object>} 任务信息和结果
   */
  async getTaskInfo(taskId, options = {}) {
    return this.executeWithErrorHandling(async () => {
      // 限流控制
      await this.checkRateLimit('getTaskInfo');
      
      // 参数验证
      this.validateRequiredParams({ taskId }, ['taskId']);
      
      // 确定缓存键
      const cacheKey = options.cacheKey || `tingwu:result:${taskId}`;
      
      // 检查缓存中是否有任务结果，除非强制刷新
      if (!options.forceFresh) {
        const cachedResult = cacheService.get(cacheKey);
        if (cachedResult) {
          // 对于已完成的任务，直接返回缓存；对于进行中的任务，如果缓存很新（<30秒），也返回缓存
          const isCacheFresh = (Date.now() - new Date(cachedResult._cachedAt || 0).getTime()) < 30000;
          if (cachedResult.data?.taskStatus === 'COMPLETED' || isCacheFresh) {
            this.logger.info(`使用缓存的任务结果: ${taskId} (状态: ${cachedResult.data?.taskStatus})`);
            return cachedResult;
          }
        }
      }
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      try {
        // 调用API获取任务信息
        const response = await this.client.getTaskInfoWithOptions(taskId, headers, runtime);
        this.logger.info(`成功获取通义听悟任务结果 (taskId: ${taskId}):`, response.body);
        
        // 处理响应，添加元数据
        const result = {
          ...response.body,
          _cached: false,
          _cachedAt: new Date().toISOString()
        };
        
        // 如果需要获取结果内容
        if (options.fetchResultContent && 
            response.body.data?.taskStatus === 'COMPLETED' && 
            response.body.data?.result) {
          
          result.resultContent = await this.fetchResultContent(response.body.data.result);
        }
        
        // 根据任务状态确定缓存时间
        let cacheTTL = options.cacheTTL;
        if (!cacheTTL) {
          cacheTTL = response.body.data?.taskStatus === 'COMPLETED' 
            ? 24 * 60 * 60 * 1000  // 已完成任务缓存24小时
            : 5 * 60 * 1000;       // 进行中任务缓存5分钟
        }
        
        // 缓存结果
        cacheService.set(cacheKey, result, cacheTTL);
        
        return result;
      } catch (error) {
        this.logger.error(`获取通义听悟任务结果失败 (taskId: ${taskId}):`, error);
        throw new ServiceError(`获取任务结果失败: ${error.message}`, 500, {
          originalError: error,
          taskId,
          options
        });
      }
    }, [], `获取通义听悟任务结果失败 (taskId: ${taskId})`);
  }

  /**
   * 获取结果URL中的内容
   * @private
   * @param {Object} result - 结果对象，包含各种URL
   * @returns {Promise<Object>} 提取的内容
   */
  async fetchResultContent(result) {
    const content = {};
    
    // 异步获取所有可能的结果内容
    const fetchPromises = [];
    
    // 转录结果
    if (result.transcription) {
      fetchPromises.push(
        this.fetchUrlContent(result.transcription)
          .then(data => { content.transcription = data; })
          .catch(err => { this.logger.error("获取转录内容失败:", err); })
      );
    }
    
    // 章节速览
    if (result.autoChapters) {
      fetchPromises.push(
        this.fetchUrlContent(result.autoChapters)
          .then(data => { content.chapters = data; })
          .catch(err => { this.logger.error("获取章节内容失败:", err); })
      );
    }
    
    // 摘要
    if (result.summarization) {
      fetchPromises.push(
        this.fetchUrlContent(result.summarization)
          .then(data => { content.summary = data; })
          .catch(err => { this.logger.error("获取摘要内容失败:", err); })
      );
    }
    
    // 文本润色
    if (result.textPolish) {
      fetchPromises.push(
        this.fetchUrlContent(result.textPolish)
          .then(data => { content.textPolish = data; })
          .catch(err => { this.logger.error("获取文本润色内容失败:", err); })
      );
    }
    
    // 等待所有请求完成
    await Promise.allSettled(fetchPromises);
    
    return content;
  }
  
  /**
   * 获取URL中的内容
   * @private
   * @param {string} url - 要获取内容的URL
   * @returns {Promise<Object>} 获取的内容
   */
  async fetchUrlContent(url) {
    const response = await axios.get(url);
    return response.data;
  }
  
  /**
   * 限流控制
   * @private
   * @param {string} apiType - API类型，'createTask'或'getTaskInfo'
   * @returns {Promise<void>}
   */
  async checkRateLimit(apiType) {
    const now = Date.now();
    const counter = this.apiCallCounters[apiType];
    const limit = this.rateLimits[apiType];
    
    // 重置计数器（如果过了一个间隔）
    if (now - counter.lastResetTime >= limit.interval) {
      counter.count = 0;
      counter.lastResetTime = now;
    }
    
    // 检查是否超过限制
    if (counter.count >= limit.qps) {
      // 计算需要等待的时间
      const waitTime = limit.interval - (now - counter.lastResetTime);
      if (waitTime > 0) {
        this.logger.warn(`API调用超过限制(${apiType})，等待${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // 递归调用，重新检查限制
        return this.checkRateLimit(apiType);
      }
    }
    
    // 增加计数
    counter.count++;
  }

  // ======== 以下是便捷方法，基于上面的通用方法实现特定业务功能 ========

  /**
   * 创建转录任务
   * @param {Object} options - 转录任务配置
   * @returns {Promise<Object>} 任务创建结果
   */
  async createTranscriptionTask(options) {
    // 生成缓存键
    const fileUrl = options.input.fileUrl;
    const cacheKey = fileUrl ? `tingwu:task:${this.hashString(fileUrl)}` : null;
    
    return this.createTask({
      type: 'offline',
      input: options.input,
      parameters: options.parameters,
      cacheKey,
      cacheTTL: 60 * 60 * 1000 // 1小时
    });
  }

  /**
   * 创建实时转录任务
   * @param {Object} options - 实时转录任务配置
   * @returns {Promise<Object>} 任务创建结果
   */
  async createRealtimeTask(options) {
    // 参数验证
    this.validateRequiredParams(options, ['sourceLanguage', 'format', 'sampleRate']);
    
    // 创建请求参数
    const input = {
      sourceLanguage: options.sourceLanguage,
      format: options.format,
      sampleRate: options.sampleRate,
      taskKey: options.taskKey || `realtime-${Date.now()}`,
      languageHints: options.languageHints
    };

    // 创建参数配置
    const parameters = {
      transcription: {
        outputLevel: options.transcriptionOutputLevel || 2,
        diarizationEnabled: options.diarizationEnabled || false
      }
    };
    
    // 如果提供了热词词表ID
    if (options.phraseId) {
      parameters.transcription.phraseId = options.phraseId;
    }
    
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
        outputLevel: options.translationOutputLevel || 2,
        targetLanguages: options.targetLanguages || ['cn']
      };
    }
    
    // 章节速览功能
    if (options.autoChaptersEnabled) {
      parameters.autoChaptersEnabled = true;
    }
    
    // 摘要总结功能
    if (options.summarizationEnabled) {
      parameters.summarizationEnabled = true;
      if (options.summarizationTypes && options.summarizationTypes.length > 0) {
        parameters.summarization = {
          types: options.summarizationTypes
        };
      }
    }
    
    // 口语书面化功能
    if (options.textPolishEnabled) {
      parameters.textPolishEnabled = true;
    }
    
    // 自定义prompt功能
    if (options.customPromptEnabled) {
      parameters.customPromptEnabled = true;
    }
    
    // 生成缓存键
    const cacheKey = `tingwu:realtime:${input.taskKey}`;
    
    return this.createTask({
      type: 'realtime',
      input,
      parameters,
      cacheKey,
      cacheTTL: 60 * 60 * 1000 // 1小时
    });
  }

  /**
   * 停止实时转录任务
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 停止任务结果
   */
  async stopRealtimeTask(taskId) {
    // 参数验证
    this.validateRequiredParams({ taskId }, ['taskId']);
    
    return this.createTask({
      type: 'realtime',
      input: {
        taskId // 在input中设置taskId
      },
      parameters: {}, // 需要提供空的parameters对象
      operation: 'stop' // 操作类型为停止
    });
  }

  /**
   * 查询任务状态和结果
   * @param {string} taskId - 任务ID
   * @param {boolean} [fetchContent=false] - 是否获取结果内容
   * @returns {Promise<Object>} 任务状态和结果
   */
  async getTaskResult(taskId, fetchContent = false) {
    return this.getTaskInfo(taskId, { 
      fetchResultContent: fetchContent 
    });
  }

  /**
   * 获取实时转录任务结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 处理后的任务结果
   */
  async getRealtimeTaskResult(taskId) {
    // 获取任务信息，包括结果内容
    const taskInfo = await this.getTaskInfo(taskId, { 
      fetchResultContent: true,
      cacheKey: `tingwu:realtime:result:${taskId}`
    });
    
    // 处理任务结果，格式化为前端需要的格式
    const resultData = {
      status: taskInfo.data?.taskStatus || 'PENDING',
      taskId,
      summary: {}
    };
    
    // 如果任务已完成并且有结果内容
    if (taskInfo.data?.taskStatus === 'COMPLETED' && taskInfo.resultContent) {
      const content = taskInfo.resultContent;
      
      // 处理章节内容
      if (content.chapters) {
        resultData.summary.chapters = content.chapters;
      }
      
      // 处理摘要内容
      if (content.summary) {
        const summaryData = content.summary;
        
        if (summaryData.paragraphs) {
          resultData.summary.paragraphs = summaryData.paragraphs;
        }
        
        if (summaryData.conversations) {
          resultData.summary.conversations = summaryData.conversations;
        }
        
        if (summaryData.questions_answering) {
          resultData.summary.questionsAnswering = summaryData.questions_answering;
        }
        
        if (summaryData.mind_map) {
          resultData.summary.mindMap = summaryData.mind_map;
        }
      }
      
      // 处理文本润色内容
      if (content.textPolish) {
        resultData.summary.textPolish = content.textPolish;
      }
      
      // 标记为已完成
      resultData.status = 'completed';
    }
    
    return resultData;
  }

  /**
   * 轮询等待任务完成
   * @param {string} taskId - 任务ID
   * @param {Object} [options] - 轮询选项
   * @param {number} [options.maxAttempts=30] - 最大尝试次数
   * @param {number} [options.interval=3000] - 轮询间隔(毫秒)
   * @param {boolean} [options.fetchContent=true] - 是否获取结果内容
   * @returns {Promise<Object>} 任务结果
   */
  async pollUntilComplete(taskId, options = {}) {
    // 设置默认值
    const maxAttempts = options.maxAttempts || 30;
    const interval = options.interval || 3000;
    const fetchContent = options.fetchContent !== false;
    
    // 初始化计数器
    let attempts = 0;
    
    // 循环检查任务状态
    while (attempts < maxAttempts) {
      attempts++;
      
      // 获取任务状态
      const taskInfo = await this.getTaskInfo(taskId, { 
        forceFresh: true,
        fetchResultContent: fetchContent
      });
      
      // 检查任务是否完成或失败
      if (taskInfo.data?.taskStatus === 'COMPLETED') {
        this.logger.info(`任务完成 (${taskId}), 尝试次数: ${attempts}`);
        return taskInfo;
      } else if (taskInfo.data?.taskStatus === 'FAILED') {
        this.logger.error(`任务失败 (${taskId}), 尝试次数: ${attempts}`);
        throw new ServiceError(`任务执行失败: ${taskInfo.data?.errorMessage || '未知错误'}`, 500, {
          taskId,
          taskInfo
        });
      }
      
      // 记录尝试次数
      this.logger.debug(`轮询任务 (${taskId}), 尝试次数: ${attempts}/${maxAttempts}, 状态: ${taskInfo.data?.taskStatus || 'unknown'}`);
      
      // 如果还没有达到最大尝试次数，等待后继续
      if (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    // 如果达到最大尝试次数仍未完成，抛出错误
    throw new ServiceError(`轮询任务超时: 达到最大尝试次数 (${maxAttempts})`, 408, {
      taskId,
      attempts,
      maxAttempts
    });
  }

  /**
   * 创建热词表
   * @param {Object} options - 热词表参数
   * @param {string} options.name - 热词表名称
   * @param {string[]} options.words - 热词列表
   * @returns {Promise<Object>} 创建结果
   */
  async createVocabulary(options) {
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
