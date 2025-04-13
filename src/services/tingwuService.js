// tingwuService.js
// 阿里云通义听悟API服务

import Tingwu from '@alicloud/tingwu20230930';
import * as OpenApi from '@alicloud/openapi-client';
import * as Util from '@alicloud/tea-util';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 通义听悟服务类
 * 封装通义听悟API的调用方法
 */
class TingwuService {
  constructor() {
    // 检查必要的环境变量
    if (!process.env.ALIYUN_ACCESS_KEY_ID || !process.env.ALIYUN_ACCESS_KEY_SECRET) {
      throw new Error('缺少阿里云AccessKey配置，请在.env文件中设置ALIYUN_ACCESS_KEY_ID和ALIYUN_ACCESS_KEY_SECRET');
    }
    
    // 初始化通义听悟SDK客户端
    this.client = this.createClient();
    this.appKey = process.env.ALIYUN_TINGWU_APP_KEY || 'ZuTDHhX19DqHnIut';
  }

  /**
   * 创建阿里云通义听悟客户端
   * @returns {Object} 通义听悟客户端实例
   */
  createClient() {
    // 配置阿里云OpenAPI客户端
    const config = new OpenApi.Config({
      // 您的AccessKey ID
      accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
      // 您的AccessKey Secret
      accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
      // 访问的区域ID
      regionId: "cn-beijing",
      // 访问的域名
      endpoint: "tingwu.cn-beijing.aliyuncs.com"  // 根据官方示例调整为北京区域
    });
    
    // 创建通义听悟客户端实例
    return new Tingwu.default(config)
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
    try {
      // 检查必要参数
      if (!options.input.fileUrl) {
        throw new Error('缺少必要参数：需要提供文件URL或OSS对象信息');
      }


      // 创建input对象
      const input = new Tingwu.CreateTaskRequestInput({
        ...options.input
      });

      const parameters = new Tingwu.CreateTaskRequestParameters({
        ...options.parameters
      });

      // 2. 创建CreateTaskRequest对象
      const createTaskRequest = new Tingwu.CreateTaskRequest({
          appKey: this.appKey,
          input: input,
          parameters: parameters
      });

      console.log("createTaskRequest", createTaskRequest);

      createTaskRequest.type = options.type || 'offline';
      
      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      console.log("官方风格createTaskRequest:", JSON.stringify(createTaskRequest, null, 2));
      
      // 调用API创建任务
      const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
      console.log("成功创建通义听悟任务:", response.body);
      return response.body;
    } catch (error) {
      console.error("创建通义听悟任务失败:", error.message);
      if (error.data && error.data.Recommend) {
        console.error("诊断信息:", error.data.Recommend);
      }
      throw error;
    }
  }

  /**
   * 查询任务状态和结果
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 任务状态和结果
   */
  async getTaskResult(taskId) {
    try {
      // 参数验证
      if (!taskId) {
        throw new Error('taskId是必需的参数');
      }
      
      // 3. 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      
      // 4. 调用API获取任务信息
      const response = await this.client.getTaskInfoWithOptions(taskId, headers, runtime);
      console.log("成功获取通义听悟任务结果:", response.body);
      return response.body;
    } catch (error) {
      console.error("获取通义听悟任务结果失败:", error.message);
      if (error.data && error.data.Recommend) {
        console.error("诊断信息:", error.data.Recommend);
      }
      throw error;
    }
  }

  /**
   * 创建热词表
   * @param {Object} options - 热词表参数
   * @param {string} options.name - 热词表名称
   * @param {string[]} options.words - 热词列表
   * @returns {Promise<Object>} 创建结果
   */
  async createVocabulary(options) {
    try {
      // 构建请求
      const createRequest = new Tingwu.CreateTranscriptionPhrasesRequest({
        name: options.name,
        words: options.words
      });

      // 设置运行时选项和请求头
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API创建热词表
      const response = await this.client.createTranscriptionPhrasesWithOptions(createRequest, headers, runtime);
      console.log("成功创建热词表:", response.body);
      return response.body;
    } catch (error) {
      console.error("创建热词表失败:", error.message);
      if (error.data && error.data.Recommend) {
        console.error("诊断信息:", error.data.Recommend);
      }
      throw error;
    }
  }
}

// 创建单例实例
const tingwuService = new TingwuService();

export default tingwuService;
