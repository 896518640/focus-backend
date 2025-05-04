// translationService.js
// 翻译记录服务

import BaseService from './BaseService.js';
import prisma from './prisma.js';

/**
 * 翻译记录服务
 * 处理翻译记录的保存、查询、删除等操作
 */
class TranslationService extends BaseService {
  constructor() {
    super('TranslationService');
  }

  /**
   * 保存翻译记录
   * @param {Object} data - 翻译记录数据
   * @param {String} userId - 用户ID
   * @returns {Promise<Object>} 保存的翻译记录
   */
  async saveTranslation(data, userId) {
    return this.executeWithErrorHandling(async () => {
      // 验证必要字段
      this.validateRequiredParams(data, [
        'title',
        'sourceLanguage',
        'targetLanguage',
        'originalText',
        'translatedText',
        'duration',
        'timestamp'
      ]);

      // 验证userId是否有效
      if (!userId) {
        const error = new Error('用户ID不能为空');
        error.status = 400;
        throw error;
      }

      // 处理可能的标签数组
      let formattedTags = null;
      if (data.tags && Array.isArray(data.tags)) {
        formattedTags = JSON.stringify(data.tags);
      }

      // 创建翻译记录
      const translation = await prisma.translation.create({
        data: {
          title: data.title,
          sourceText: data.originalText,
          translatedText: data.translatedText,
          sourceLanguage: data.sourceLanguage,
          targetLanguage: data.targetLanguage,
          taskId: data.taskId || null,
          taskStatus: data.taskStatus || null,
          duration: data.duration,
          timestamp: BigInt(data.timestamp),
          outputMp3Path: data.outputMp3Path || null,
          errorMessage: data.errorMessage || null,
          tags: formattedTags,
          status: data.taskStatus || 'success',
          user: {
            connect: { id: userId }
          }
        }
      });

      // 更新用户使用统计
      await this.updateTranslationCount(userId);

      // 记录用户活动
      await this.recordActivity(userId, translation.id, data.title);

      return this.formatTranslation(translation);
    }, [], '保存翻译记录失败');
  }

  /**
   * 获取翻译记录列表
   * @param {Number} page - 页码
   * @param {Number} pageSize - 每页条数
   * @param {String} userId - 用户ID
   * @returns {Promise<Object>} 翻译记录列表及总数
   */
  async getTranslationList(page = 1, pageSize = 10, userId) {
    return this.executeWithErrorHandling(async () => {
      const skip = (page - 1) * pageSize;
      
      // 查询总数
      const total = await prisma.translation.count({
        where: { userId }
      });

      // 查询翻译记录列表
      const translations = await prisma.translation.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      });

      // 处理结果
      return {
        total,
        list: translations.map(this.formatTranslation)
      };
    }, [], '获取翻译记录列表失败');
  }

  /**
   * 获取翻译记录详情
   * @param {String} id - 记录ID
   * @param {String} userId - 用户ID
   * @returns {Promise<Object>} 翻译记录详情
   */
  async getTranslationDetail(id, userId) {
    return this.executeWithErrorHandling(async () => {
      // 查询翻译记录
      const translation = await prisma.translation.findUnique({
        where: { id }
      });

      // 验证记录是否存在
      if (!translation) {
        const error = new Error('翻译记录不存在');
        error.status = 404;
        throw error;
      }

      // 验证记录所有者
      if (translation.userId !== userId) {
        const error = new Error('无权访问此翻译记录');
        error.status = 403;
        throw error;
      }

      return this.formatTranslation(translation);
    }, [], '获取翻译记录详情失败');
  }

  /**
   * 删除翻译记录
   * @param {String} id - 记录ID
   * @param {String} userId - 用户ID
   * @returns {Promise<Object>} 操作结果
   */
  async deleteTranslation(id, userId) {
    return this.executeWithErrorHandling(async () => {
      // 查询翻译记录
      const translation = await prisma.translation.findUnique({
        where: { id }
      });

      // 验证记录是否存在
      if (!translation) {
        const error = new Error('翻译记录不存在');
        error.status = 404;
        throw error;
      }

      // 验证记录所有者
      if (translation.userId !== userId) {
        const error = new Error('无权删除此翻译记录');
        error.status = 403;
        throw error;
      }

      // 删除翻译记录
      await prisma.translation.delete({
        where: { id }
      });

      return { success: true };
    }, [], '删除翻译记录失败');
  }

  /**
   * 更新用户的翻译使用计数
   * @param {String} userId - 用户ID
   * @returns {Promise<void>}
   */
  async updateTranslationCount(userId) {
    try {
      // 查找或创建用户统计记录
      await prisma.usageStats.upsert({
        where: { userId },
        update: {
          translationCount: {
            increment: 1
          }
        },
        create: {
          userId,
          translationCount: 1
        }
      });
    } catch (error) {
      this.logger.error(`更新用户翻译计数失败: ${error.message}`, error);
      // 继续执行，不阻塞主流程
    }
  }

  /**
   * 记录用户翻译活动
   * @param {String} userId - 用户ID
   * @param {String} translationId - 翻译记录ID
   * @param {String} title - 翻译标题
   * @returns {Promise<void>}
   */
  async recordActivity(userId, translationId, title) {
    try {
      await prisma.activity.create({
        data: {
          userId,
          title: `创建翻译: ${title}`,
          description: `创建了新的翻译记录`,
          type: 'translation',
          icon: 'translate',
          iconBg: '#4caf50'
        }
      });
    } catch (error) {
      this.logger.error(`记录翻译活动失败: ${error.message}`, error);
      // 继续执行，不阻塞主流程
    }
  }

  /**
   * 格式化翻译记录
   * @param {Object} translation - 原始翻译记录
   * @returns {Object} 格式化后的翻译记录
   */
  formatTranslation(translation) {
    // 处理BigInt
    const formatted = {
      ...translation,
      timestamp: Number(translation.timestamp),
      tags: translation.tags ? JSON.parse(translation.tags) : [],
      originalText: translation.sourceText,
      createdAt: translation.createdAt.toISOString(),
      updatedAt: translation.updatedAt ? translation.updatedAt.toISOString() : null
    };

    // 返回格式化数据
    return formatted;
  }
}

export default new TranslationService(); 