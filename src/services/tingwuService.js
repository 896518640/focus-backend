// tingwuService.js
// 阿里云通义听悟API服务，基于官方Demo重新实现

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
    
    // 初始化SDK客户端
    this.client = this.createClient();
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
      regionId: "cn-hangzhou",
      // 访问的域名
      endpoint: "tingwu.cn-hangzhou.aliyuncs.com"
    });
    
    // 创建通义听悟客户端实例 - 正确的初始化方式
    // console.log("创建通义听悟客户端实例", config, Tingwu);
    // return new Tingwu(config);
    return new Tingwu.default(config)
  }

  /**
   * 创建语音识别任务
   * @param {Object} options - 任务参数
   * @param {string} options.ossObjectKey - OSS对象键
   * @param {string} options.ossBucket - OSS存储桶名称
   * @param {string} [options.name] - 任务名称
   * @param {string} [options.vocabularyId] - 热词表ID
   * @returns {Promise<Object>} 创建任务的响应
   */
  async createTask(options) {
    try {
      // 构建请求
      const createTaskRequest = new Tingwu.CreateTaskRequest({
        ossObjectKey: options.ossObjectKey,
        ossBucket: options.ossBucket,
        name: options.name || 'SpeakFlow语音识别任务',
        vocabularyId: options.vocabularyId
      });

      // 添加运行时选项
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API创建任务
      const response = await this.client.createTaskWithOptions(createTaskRequest, headers, runtime);
      console.log("成功创建通义听悟任务:", response.body);
      return response.body;
    } catch (error) {
      console.error("创建通义听悟任务失败:", error.message);
      if (error.data && error.data["Recommend"]) {
        console.error("诊断信息:", error.data["Recommend"]);
      }
      throw error;
    }
  }

  /**
   * 获取任务信息
   * @param {string} taskId - 任务ID
   * @returns {Promise<Object>} 任务信息
   */
  async getTaskInfo(taskId) {
    try {
      // 构建请求
      const getTaskInfoRequest = new Tingwu.GetTaskInfoRequest({
        taskId: taskId
      });

      // 添加运行时选项
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API获取任务信息
      const response = await this.client.getTaskInfoWithOptions(getTaskInfoRequest, headers, runtime);
      console.log("成功获取通义听悟任务信息:", response.body);
      return response.body;
    } catch (error) {
      console.error("获取通义听悟任务信息失败:", error.message);
      if (error.data && error.data["Recommend"]) {
        console.error("诊断信息:", error.data["Recommend"]);
      }
      throw error;
    }
  }

  /**
   * 创建热词词表
   * @param {Object} options - 热词表参数
   * @param {string} options.name - 热词表名称
   * @param {string[]} options.words - 热词列表
   * @returns {Promise<Object>} 创建热词表的响应
   */
  async createVocabulary(options) {
    try {
      // 构建请求
      const createRequest = new Tingwu.CreateTranscriptionPhrasesRequest({
        name: options.name,
        words: options.words
      });

      // 添加运行时选项
      const runtime = new Util.RuntimeOptions({});
      const headers = {};
      
      // 调用API创建热词表
      const response = await this.client.createTranscriptionPhrasesWithOptions(createRequest, headers, runtime);
      console.log("成功创建热词表:", response.body);
      return response.body;
    } catch (error) {
      console.error("创建热词表失败:", error.message);
      if (error.data && error.data["Recommend"]) {
        console.error("诊断信息:", error.data["Recommend"]);
      }
      throw error;
    }
  }
}

// 创建单例实例
const tingwuService = new TingwuService();

export default tingwuService;
