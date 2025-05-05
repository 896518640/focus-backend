// translationController.js
// 翻译控制器 - 处理翻译记录相关API请求

import BaseController from './BaseController.js';
import translationService from '../services/translationService.js';
import openaiService from '../services/openaiService.js';

/**
 * 翻译控制器
 * 处理翻译记录的保存、获取、删除等API请求
 */
class TranslationController extends BaseController {
  constructor() {
    super('TranslationController');
  }

  /**
   * 流式总结文本
   * 使用指定语言对文本内容进行总结，并以流式方式返回
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @returns {Promise<void>}
   */
  streamingSummarize = async (req, res) => {
    try {
      // 验证请求体存在
      if (!req.body) {
        return this.fail(res, '请求体不能为空', null, 400);
      }

      // 检查服务是否可用
      if (!openaiService.isAvailable()) {
        return this.fail(res, 'OpenAI服务未配置，请联系管理员设置OPENROUTER_API_KEY', null, 503);
      }

      // 从请求体获取参数
      const { text, language } = req.body;
      
      // 验证必要参数
      if (!text || typeof text !== 'string' || text.trim() === '') {
        return this.fail(res, '待总结的文本不能为空', null, 400);
      }

      if (!language || typeof language !== 'string' || language.trim() === '') {
        return this.fail(res, '总结语言不能为空', null, 400);
      }

      this.logger.info('处理流式总结请求', { 
        textLength: text.length,
        language
      });

      // 构建提示信息
      const prompt = `请用${language}语言对以下文本进行简洁、全面的总结，保留关键信息和主要观点：\n\n${text}`;
      
      // 设置响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // 使用流式API
      const stream = await openaiService.createStreamingChatCompletion({
        // model:'anthropic/claude-3-opus',
        model:'qwen/qwen3-30b-a3b',
        messages: [
          { role: 'system', content: '你是一个专业语言大师，擅长用简洁、全面的语言对文本进行总结。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // 使用较低的温度以获得更精确的总结
      });

      // 处理流式响应
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          // 清理内容中的多余换行符
          const cleanedContent = req.query.cleanFormat === 'true' ? 
            content.replace(/\n+/g, ' ').trim() : content;
            
          // 发送事件流格式的数据
          res.write(`data: ${JSON.stringify({ content: cleanedContent })}\n\n`);
        }
      }

      // 发送结束标记
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      this.logger.error('流式总结请求失败', error);
      
      // 如果连接仍然打开，则发送错误信息
      if (!res.headersSent) {
        return this.fail(res, `流式总结失败: ${error.message}`, null, 500);
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    }
  };

  /**
   * 保存翻译记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async saveTranslation(req, res) {
    try {
      const userId = req.user.userId;
      const translationData = req.body;

      const result = await translationService.saveTranslation(translationData, userId);

      this.success(res, '翻译记录保存成功', result, 201); // 使用201状态码表示资源创建成功
    } catch (error) {
      this.fail(res, error.message || '保存翻译记录失败', error, error.status || 500);
    }
  }

  /**
   * 获取翻译记录列表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getTranslationList(req, res) {
    try {
      const userId = req.user.userId;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 10;

      const result = await translationService.getTranslationList(page, pageSize, userId);

      this.success(res, '获取翻译记录列表成功', result);
    } catch (error) {
      this.fail(res, error.message || '获取翻译记录列表失败', error, error.status || 500);
    }
  }

  /**
   * 获取翻译记录详情
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getTranslationDetail(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!id) {
        return this.fail(res, '记录ID不能为空', null, 400);
      }

      const result = await translationService.getTranslationDetail(id, userId);

      this.success(res, '获取翻译记录详情成功', result);
    } catch (error) {
      // 使用合适的状态码
      if (error.message.includes('不存在')) {
        this.fail(res, error.message, error, 404);
      } else if (error.message.includes('无权访问')) {
        this.fail(res, error.message, error, 403);
      } else {
        this.fail(res, error.message || '获取翻译记录详情失败', error, error.status || 500);
      }
    }
  }

  /**
   * 删除翻译记录
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async deleteTranslation(req, res) {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (!id) {
        return this.fail(res, '记录ID不能为空', null, 400);
      }

      const result = await translationService.deleteTranslation(id, userId);

      this.success(res, '翻译记录删除成功', result);
    } catch (error) {
      // 使用合适的状态码
      if (error.message.includes('不存在')) {
        this.fail(res, error.message, error, 404);
      } else if (error.message.includes('无权删除')) {
        this.fail(res, error.message, error, 403);
      } else {
        this.fail(res, error.message || '删除翻译记录失败', error, error.status || 500);
      }
    }
  }
}

export default new TranslationController(); 