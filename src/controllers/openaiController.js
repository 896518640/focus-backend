// openaiController.js
// OpenAI/OpenRouter API 控制器

import BaseController from './BaseController.js';
import openaiService from '../services/openaiService.js';

/**
 * OpenAI控制器
 * 处理AI生成内容的API请求
 */
class OpenAIController extends BaseController {
  constructor() {
    super('OpenAIController');
  }

  /**
   * 创建聊天完成
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  createChatCompletion = this.handleAsync(async (req, res) => {
    // 验证请求体存在
    if (!req.body) {
      return this.fail(res, '请求体不能为空', null, 400);
    }

    // 检查服务是否可用
    if (!openaiService.isAvailable()) {
      return this.fail(res, 'OpenAI服务未配置，请联系管理员设置OPENROUTER_API_KEY', null, 503);
    }

    // 从请求体获取参数
    const { model, messages, temperature } = req.body;

    // 调用服务
    const result = await openaiService.createChatCompletion({
      model,
      messages,
      temperature,
    });

    // 返回成功响应
    return this.success(res, 'AI响应生成成功', result);
  });

  /**
   * 创建简单文本完成（单轮对话）
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  createCompletion = this.handleAsync(async (req, res) => {
    // 验证请求体存在
    if (!req.body) {
      return this.fail(res, '请求体不能为空', null, 400);
    }

    // 检查服务是否可用
    if (!openaiService.isAvailable()) {
      return this.fail(res, 'OpenAI服务未配置，请联系管理员设置OPENROUTER_API_KEY', null, 503);
    }

    // 从请求体获取参数
    const { prompt, model, temperature } = req.body;

    // 验证提示文本存在
    if (!prompt) {
      return this.fail(res, '提示文本不能为空', null, 400);
    }

    // 调用服务
    const result = await openaiService.createCompletion(prompt, {
      model,
      temperature,
    });

    // 返回成功响应
    return this.success(res, 'AI响应生成成功', result);
  });

  /**
   * 获取配置信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  getConfig = this.handleAsync(async (req, res) => {
    // 检查服务是否初始化
    const isInitialized = openaiService.isAvailable();
    
    return this.success(res, 'OpenAI配置获取成功', {
      isInitialized,
      defaultModel: process.env.OPENROUTER_DEFAULT_MODEL || 'openai/gpt-4o',
      availableModels: [
        'openai/gpt-4o',
        'openai/gpt-4-turbo',
        'anthropic/claude-3-opus',
        'anthropic/claude-3-sonnet',
        'google/gemini-pro',
        'meta-llama/llama-3-70b',
      ]
    });
  });
}

// 导出单例实例
export default new OpenAIController(); 