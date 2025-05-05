// openaiService.js
// OpenAI/OpenRouter API 集成服务

import OpenAI from 'openai';
import BaseService from './BaseService.js';
import config from '../config/index.js';

/**
 * OpenAI服务
 * 提供OpenAI/OpenRouter API集成
 */
class OpenAIService extends BaseService {
  constructor() {
    super('OpenAIService');
    this.openai = null;
    this.initClient();
  }

  /**
   * 初始化OpenAI客户端
   */
  initClient() {
    try {
      // 检查必要配置
      if (!config.openai?.apiKey) {
        this.logger.warn('OpenRouter API Key未配置，OpenAI服务将不可用');
        return;
      }

      this.openai = new OpenAI({
        baseURL: config.openai.baseURL || 'https://openrouter.ai/api/v1',
        apiKey: config.openai.apiKey,
        defaultHeaders: {
          'HTTP-Referer': config.openai.referer || process.env.APP_URL || 'http://localhost:3000',
          'X-Title': config.openai.title || process.env.APP_NAME || 'Focus AI App',
        },
      });

      this.logger.info('OpenAI/OpenRouter 客户端初始化成功');
    } catch (error) {
      this.logger.error('OpenAI/OpenRouter 客户端初始化失败', error);
    }
  }

  /**
   * 创建聊天完成
   * @param {Object} options - 聊天参数
   * @param {String} options.model - 使用的模型
   * @param {Array<Object>} options.messages - 消息列表
   * @param {Number} options.temperature - 温度参数
   * @returns {Promise<Object>} 聊天完成结果
   */
  async createChatCompletion(options) {
    return this.executeWithErrorHandling(async () => {
      // 验证必要参数
      this.validateRequiredParams(options, ['messages']);

      // 确保客户端已初始化
      if (!this.openai) {
        throw new Error('OpenAI服务未配置，请在环境变量中设置OPENROUTER_API_KEY');
      }

      // 设置默认参数
      const defaultOptions = {
        model: config.openai.defaultModel || 'openai/gpt-4o',
        temperature: 0.7,
      };

      // 合并参数
      const requestOptions = { ...defaultOptions, ...options };

      // 调用API
      const completion = await this.openai.chat.completions.create(requestOptions);

      // 检查返回结果
      if (!completion || !completion.choices || !completion.choices.length) {
        throw new Error('API返回结果格式异常，未包含有效回复');
      }

      // 返回结果
      return {
        message: completion.choices[0].message,
        usage: completion.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        model: completion.model || requestOptions.model,
      };
    }, [], 'OpenAI聊天完成请求失败');
  }

  /**
   * 创建流式聊天完成
   * @param {Object} options - 聊天参数
   * @param {String} options.model - 使用的模型
   * @param {Array<Object>} options.messages - 消息列表
   * @param {Number} options.temperature - 温度参数
   * @returns {Promise<ReadableStream>} 聊天完成流
   */
  async createStreamingChatCompletion(options) {
    try {
      // 验证必要参数
      this.validateRequiredParams(options, ['messages']);

      // 确保客户端已初始化
      if (!this.openai) {
        throw new Error('OpenAI服务未配置，请在环境变量中设置OPENROUTER_API_KEY');
      }

      // 设置默认参数
      const defaultOptions = {
        model: config.openai.defaultModel || 'openai/gpt-4o',
        temperature: 0.7,
        stream: true, // 启用流式传输
      };

      // 合并参数
      const requestOptions = { ...defaultOptions, ...options, stream: true };
      this.logger.debug('创建流式聊天完成', { model: requestOptions.model });

      // 调用流式API
      return await this.openai.chat.completions.create(requestOptions);
    } catch (error) {
      this.logger.error('OpenAI流式聊天完成请求失败', error);
      throw error;
    }
  }

  /**
   * 创建文本完成
   * @param {String} prompt - 提示文本
   * @param {Object} options - 额外选项
   * @returns {Promise<Object>} 文本完成结果
   */
  async createCompletion(prompt, options = {}) {
    const messages = [{ role: 'user', content: prompt }];
    return this.createChatCompletion({ ...options, messages });
  }

  /**
   * 检查服务是否可用
   * @returns {Boolean} 是否可用
   */
  isAvailable() {
    return !!this.openai;
  }
}

// 导出单例实例
export default new OpenAIService(); 