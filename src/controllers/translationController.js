// translationController.js
// 翻译控制器 - 处理翻译记录相关API请求

import BaseController from './BaseController.js';
import translationService from '../services/translationService.js';

/**
 * 翻译控制器
 * 处理翻译记录的保存、获取、删除等API请求
 */
class TranslationController extends BaseController {
  constructor() {
    super('TranslationController');
  }

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