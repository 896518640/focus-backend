// mainTingwuService.js
// 通用阿里云通义听悟API服务 - 包含所有API接口

import Tingwu from '@alicloud/tingwu20230930';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import configService from '../config/configService.js';
import { ConfigError, AppError, ServiceError } from '../utils/errors.js';
import createLogger from '../utils/logger.js';
import BaseService from './BaseService.js';

/**
 * 通义听悟服务
 * 封装CreateTask和GetTaskInfo两个核心API
 */
class MainTingwuService extends BaseService {
  constructor() {
    super('MainTingwuService');
    this.logger = createLogger('MainTingwuService');
    
    // 初始化配置检查
    this.initConfig();
    
    // 初始化通义听悟SDK客户端
    this.client = this.createClient();
    this.appKey = configService.get('aliyun.tingwu.appKey', 'ZuTDHhX19DqHnIut');
    
    this.logger.info('通义听悟服务已初始化');
  }

  /**
   * 初始化配置检查
   * @private
   * @throws {ConfigError} 配置错误
   */
  initConfig() {
    try {
      const requiredConfig = ['aliyun.accessKeyId', 'aliyun.accessKeySecret'];
      const missingKeys = [];
      
      for (const key of requiredConfig) {
        if (!configService.validateRequiredConfig(key)) {
          missingKeys.push(key);
        }
      }
      
      if (missingKeys.length > 0) {
        throw new ConfigError(
          `缺少阿里云AccessKey配置: ${missingKeys.join(', ')}`,
          500,
          { missingKeys }
        );
      }
    } catch (error) {
      this.logger.error('初始化配置错误', error);
      throw error;
    }
  }

  /**
   * 创建阿里云通义听悟客户端
   * @private
   * @returns {Tingwu.default} 通义听悟客户端实例
   */
  createClient() {
    // 配置阿里云OpenAPI客户端
    const config = new OpenApi.Config({
      accessKeyId: configService.get('aliyun.accessKeyId'),
      accessKeySecret: configService.get('aliyun.accessKeySecret'),
      regionId: configService.get('aliyun.tingwu.regionId', 'cn-beijing'),
      endpoint: configService.get('aliyun.tingwu.endpoint', 'tingwu.cn-beijing.aliyuncs.com')
    });
    
    // 创建通义听悟客户端实例
    return new Tingwu.default(config);
  }

  /**
   * 创建通义听悟任务
   * @async
   * @param {Object} options - 任务配置
   * @param {string} options.type - 任务类型: 'offline'(离线转录) 或 'realtime'(实时转录)
   * @param {Object} options.input - 任务输入参数对象或CreateTaskRequestInput实例
   * @param {Object} [options.parameters] - 任务参数对象或CreateTaskRequestParameters实例
   * @param {string} [options.operation] - 操作类型，如'stop'用于停止实时任务
   * @returns {Promise<Object>} API响应结果
   * @throws {AppError} 参数错误
   * @throws {ServiceError} 服务调用错误
   */
  async createTask(options) {
    try {
      // 参数验证
      if (!options.type) {
        throw new AppError('缺少必要参数: type', 400);
      }
      
      if (!options.input) {
        throw new AppError('缺少必要参数: input', 400);
      }
      
      if (options.type !== 'offline' && options.type !== 'realtime') {
        throw new AppError('无效的任务类型，必须为 offline 或 realtime', 400);
      }
      
      // 创建input对象
      let input = options.input;
      if (!(input instanceof Tingwu.CreateTaskRequestInput)) {
        try {
          input = new Tingwu.CreateTaskRequestInput({
            sourceLanguage: "cn",
            ...options.input
          });
        } catch (error) {
          throw new AppError(`无效的input参数: ${error.message}`, 400);
        }
      }
      
      // 创建parameters对象
      let parameters = options.parameters || {};
      if (!(parameters instanceof Tingwu.CreateTaskRequestParameters)) {
        try {
          console.log("createTask parameters", parameters);
          parameters = new Tingwu.CreateTaskRequestParameters({
            autoChaptersEnabled: true, // 启用章节速览 
            //  contentExtraction?: CreateTaskRequestParametersContentExtraction; // 内容提取
            contentExtractionEnabled: false, // 是否启用内容提取功能。
            //  customPrompt?: CreateTaskRequestParametersCustomPrompt; // 自定义 Prompt 控制参数对象。
            customPromptEnabled: false, // 是否启用自定义 Prompt 功能。
            //  extraParams?: CreateTaskRequestParametersExtraParams; // 扩展参数，通常情况无须设置。
            //  identityRecognition?: CreateTaskRequestParametersIdentityRecognition; // 人名识别
            identityRecognitionEnabled: false, // 是否启用人名识别功能。
            //  meetingAssistance?: CreateTaskRequestParametersMeetingAssistance; // 会议助手
            meetingAssistanceEnabled: false, // 是否启用会议助手功能。
            pptExtractionEnabled: false,    // 是否启用PPT提取功能。
            //  serviceInspection?: CreateTaskRequestParametersServiceInspection; // 服务检查
            serviceInspectionEnabled: false,  // 是否启用服务检查功能。
            //  summarization?: CreateTaskRequestParametersSummarization; // 摘要
            summarizationEnabled: false, // 是否启用摘要功能。
            textPolishEnabled: false, // 是否启用口语书面化功能。
            //  transcoding?: CreateTaskRequestParametersTranscoding; // 音视频或音频流转码转换模块
            //  transcription?: CreateTaskRequestParametersTranscription; // 语音转写控制参数。
            //  translation?: CreateTaskRequestParametersTranslation; // 翻译功能控制参数。
            translationEnabled: false, // 是否启用翻译功能
              ...parameters
          });

          console.log("createTask parameters", parameters);
        } catch (error) {
          throw new AppError(`无效的parameters参数: ${error.message}`, 400);
        }
      }

      // 创建CreateTaskRequest对象
      const createTaskRequest = new Tingwu.CreateTaskRequest({
        appKey: this.appKey,
        input: input,
        parameters: parameters,
        type: options.type
      });

      // 设置操作（如果有）
      if (options.operation) {
        createTaskRequest.operation = options.operation;
      }
      
      console.log("createTaskRequest", createTaskRequest);
      this.logger.debug("创建任务请求参数类型", createTaskRequest);
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API创建任务
      const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
      
      // 检查API响应状态
      if (response?.body?.code !== '0') {
        throw new ServiceError(`API返回错误: ${response?.body?.message || '未知错误'}`, 500, {
          apiResponse: response?.body
        });
      }
      
      this.logger.info(`成功创建通义听悟任务 (类型: ${options.type}, 任务ID: ${response?.body?.data?.taskId || 'unknown'})`);
      
      return response.body;
    } catch (error) {
      if (error instanceof AppError || error instanceof ServiceError) {
        throw error;
      }
      
      this.logger.error(`创建通义听悟任务失败:`, error);
      throw new ServiceError(`创建任务失败: ${error.message}`, 500, {
        originalError: error,
        options
      });
    }
  }
  
  /**
   * 获取任务信息
   * @async
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} API响应结果
   * @throws {AppError} 参数错误
   * @throws {ServiceError} 服务调用错误
   */
  async getTaskInfo(taskId) {
    try {
      // 参数验证
      if (!taskId) {
        throw new AppError('缺少必要参数: taskId', 400);
      }
      
      if (typeof taskId !== 'string') {
        throw new AppError('taskId必须为字符串', 400);
      }
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API获取任务信息
      const response = await this.client.getTaskInfoWithOptions(taskId, headers, runtime);
      
      // 检查API响应状态
      if (response?.body?.code !== '0') {
        throw new ServiceError(`API返回错误: ${response?.body?.message || '未知错误'}`, 500, {
          apiResponse: response?.body
        });
      }
      
      const taskStatus = response?.body?.data?.taskStatus || 'UNKNOWN';
      this.logger.info(`成功获取通义听悟任务信息 (taskId: ${taskId}, 状态: ${taskStatus})`);
      
      return response.body;
    } catch (error) {
      if (error instanceof AppError || error instanceof ServiceError) {
        throw error;
      }
      
      this.logger.error(`获取通义听悟任务信息失败:`, error);
      throw new ServiceError(`获取任务信息失败: ${error.message}`, 500, {
        originalError: error,
        taskId
      });
    }
  }
}

// 创建单例实例
const mainTingwuService = new MainTingwuService();

export default mainTingwuService; 