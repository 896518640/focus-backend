// tingwuController.js
// 阿里云通义听悟API控制器

import tingwuService from '../services/tingwuService.js';

/**
 * 通义听悟控制器
 * 处理通义听悟API相关的请求
 */
class TingwuController {
  /**
   * 创建语音识别任务
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createTask(req, res) {
    try {
      const { ossObjectKey, ossBucket, name, vocabularyId } = req.body;
      
      // 参数验证
      if (!ossObjectKey || !ossBucket) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：ossObjectKey和ossBucket'
        });
      }
      
      // 调用服务创建任务
      const result = await tingwuService.createTask({
        ossObjectKey,
        ossBucket,
        name,
        vocabularyId
      });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('创建通义听悟任务失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建通义听悟任务失败',
        error: error.message
      });
    }
  }

  /**
   * 获取任务信息
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async getTaskInfo(req, res) {
    try {
      const { taskId } = req.params;
      
      // 参数验证
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：taskId'
        });
      }
      
      // 调用服务获取任务信息
      const result = await tingwuService.getTaskInfo(taskId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('获取通义听悟任务信息失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取通义听悟任务信息失败',
        error: error.message
      });
    }
  }

  /**
   * 创建热词词表
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createVocabulary(req, res) {
    try {
      const { name, words } = req.body;
      
      // 参数验证
      if (!name || !words || !Array.isArray(words)) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：name和words数组'
        });
      }
      
      // 调用服务创建热词词表
      const result = await tingwuService.createVocabulary({
        name,
        words
      });
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('创建热词词表失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建热词词表失败',
        error: error.message
      });
    }
  }
}

export default new TingwuController();