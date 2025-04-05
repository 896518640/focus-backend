// tingwuController.js
// 通义听悟功能控制器

import fileUploadService from '../services/fileUploadService.js';
import tingwuService from '../services/tingwuService.js';
import transcriptionService from '../services/transcriptionService.js';
import axios from 'axios';

/**
 * 通义听悟控制器
 * 处理音频转录相关的HTTP请求
 */
class TingwuController {
  /**
   * 上传音频文件
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async uploadFile(req, res) {
    try {
      // 检查文件是否存在
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未找到上传文件'
        });
      }

      // 调用文件上传服务
      const result = await fileUploadService.uploadFile(req.file);

      return res.status(200).json({
        success: true,
        message: '文件上传成功',
        data: result
      });
    } catch (error) {
      console.error('文件上传失败:', error);
      return res.status(500).json({
        success: false,
        message: '文件上传失败',
        error: error.message
      });
    }
  }

  /**
   * 上传音频并创建转录任务
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async uploadAndTranscribe(req, res) {
    try {
      // 检查文件是否存在
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: '未找到上传文件'
        });
      }

      // 获取转录选项
      const options = {
        sourceLanguage: req.body.sourceLanguage,
        type: req.body.type
      };

      console.log("options", options);

      // 调用转录服务
      const result = await transcriptionService.uploadAndTranscribe(req.file, options);
      console.log("result11111", result);
      return res.status(200).json({
        success: true,
        message: '音频上传并创建转录任务成功',
        data: result
      });
    } catch (error) {
      console.error('音频上传或转录失败:', error);
      return res.status(500).json({
        success: false,
        message: '音频上传或转录失败',
        error: error.message
      });
    }
  }

  /**
   * 创建转录任务
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async createTask(req, res) {
    try {
      const { ossObjectKey, ossBucket, name, vocabularyId, fileUrl, taskKey, sourceLanguage, type } = req.body;

      // 参数验证：OSS方式或URL方式二选一
      if ((!ossObjectKey || !ossBucket) && !fileUrl) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：需要提供OSS信息(ossObjectKey和ossBucket)或fileUrl'
        });
      }

      // 调用通义听悟服务创建任务
      const result = await tingwuService.createTranscriptionTask({
        ossObjectKey,
        ossBucket,
        name,
        vocabularyId,
        fileUrl,
        taskKey,
        sourceLanguage,
        type: type || 'offline'
      });

      console.log("result1111", result);

      return res.status(200).json({
        success: true,
        message: '转录任务创建成功',
        data: result
      });
    } catch (error) {
      console.error('创建转录任务失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建转录任务失败',
        error: error.message
      });
    }
  }

  /**
   * 获取任务状态和结果
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

      // 调用通义听悟服务获取任务信息
      const result = await tingwuService.getTaskResult(taskId);

      // 简化数据结构，直接返回关键信息
      const simplifiedData = {
        taskId: result.data?.taskId || taskId,
        taskKey: result.data?.taskKey,
        taskStatus: result.data?.taskStatus,
        transcription: result.data?.result?.transcription,
        message: result.message || 'success'
      };

      return res.status(200).json({
        success: true,
        message: '获取任务信息成功',
        data: simplifiedData
      });
    } catch (error) {
      console.error('获取任务信息失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取任务信息失败',
        error: error.message
      });
    }
  }

  /**
   * 轮询任务结果直到完成
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async pollTaskResult(req, res) {
    try {
      const { taskId } = req.params;
      const { maxAttempts, interval } = req.query;

      // 参数验证
      if (!taskId) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：taskId'
        });
      }

      // 调用转录服务轮询任务结果
      const result = await transcriptionService.pollUntilComplete(
        taskId,
        maxAttempts ? parseInt(maxAttempts) : 30,
        interval ? parseInt(interval) : 3000
      );

      // 简化数据结构，直接返回关键信息
      const simplifiedData = {
        taskId: result.Data?.TaskId || taskId,
        taskKey: result.Data?.TaskKey,
        taskStatus: result.Data?.TaskStatus,
        transcription: result.Data?.Result?.transcription,
        message: result.Message || 'success'
      };

      return res.status(200).json({
        success: true,
        message: '转录任务完成',
        data: simplifiedData
      });
    } catch (error) {
      console.error('获取转录结果失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取转录结果失败',
        error: error.message
      });
    }
  }

  /**
   * 获取JSON文件内容
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   */
  async fetchJsonContent(req, res) {
    try {
      const { url } = req.body;

      // 参数验证
      if (!url) {
        return res.status(400).json({
          success: false,
          message: '缺少必要参数：url'
        });
      }

      // 获取JSON文件内容
      const response = await axios.get(url);

      // 返回JSON数据
      return res.status(200).json({
        success: true,
        message: '获取JSON文件内容成功',
        data: response.data
      });
    } catch (error) {
      console.error('获取JSON文件内容失败:', error);
      return res.status(500).json({
        success: false,
        message: '获取JSON文件内容失败',
        error: error.message
      });
    }
  }

  /**
   * 创建热词表
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

      // 调用通义听悟服务创建热词表
      const result = await tingwuService.createVocabulary({
        name,
        words
      });

      return res.status(200).json({
        success: true,
        message: '热词表创建成功',
        data: result
      });
    } catch (error) {
      console.error('创建热词表失败:', error);
      return res.status(500).json({
        success: false,
        message: '创建热词表失败',
        error: error.message
      });
    }
  }
}

export default new TingwuController();