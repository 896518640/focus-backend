// tingwuController.js
// 通义听悟功能控制器

import BaseController from './BaseController.js';
import fileUploadService from '../services/fileUploadService.js';
import tingwuService from '../services/tingwuService.js';
import transcriptionService from '../services/transcriptionService.js';
import axios from 'axios';

/**
 * @swagger
 * tags:
 *   name: 通义听悟
 *   description: 音频识别与转录相关API
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     TranscriptionTask:
 *       type: object
 *       required:
 *         - type
 *         - input
 *       properties:
 *         type:
 *           type: string
 *           enum: [offline]
 *           description: 转录任务类型，目前支持离线转录
 *         input:
 *           type: object
 *           properties:
 *             sourceLanguage:
 *               type: string
 *               enum: [cn, en]
 *               description: 音频源语言，cn为中文，en为英文
 *             fileUrl:
 *               type: string
 *               description: 音频文件URL
 *         parameters:
 *           type: object
 *           properties:
 *             transcription:
 *               type: object
 *               properties:
 *                 diarizationEnabled:
 *                   type: boolean
 *                   description: 是否启用说话人分离
 *                 diarization:
 *                   type: object
 *                   properties:
 *                     speakerCount:
 *                       type: integer
 *                       description: 说话人数量
 */

/**
 * 通义听悟控制器
 * 处理音频转录相关的HTTP请求
 */
class TingwuController extends BaseController {
  constructor() {
    super('TingwuController');
  }

  /**
   * @swagger
   * /tingwu/upload:
   *   post:
   *     summary: 上传音频文件
   *     description: 上传音频文件并返回文件的URL，用于后续转录
   *     tags: [通义听悟]
   *     consumes:
   *       - multipart/form-data
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               audio:
   *                 type: string
   *                 format: binary
   *                 description: 音频文件（MP3、WAV等格式）
   *     responses:
   *       200:
   *         description: 文件上传成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 文件上传成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     fileName:
   *                       type: string
   *                     fileUrl:
   *                       type: string
   *                     size:
   *                       type: number
   *       400:
   *         description: 请求无效，可能是缺少文件
   *       500:
   *         description: 服务器错误
   */
  async uploadFile(req, res) {
    try {
      // 检查文件是否存在
      if (!req.file) {
        return this.fail(res, '未找到上传文件', null, 400);
      }

      // 调用文件上传服务
      const result = await fileUploadService.uploadFile(req.file);
      return this.success(res, '文件上传成功', result);
    } catch (error) {
      this.logger.error('文件上传失败:', error);
      return this.fail(res, '文件上传失败', error, 500);
    }
  }

  /**
   * @swagger
   * /tingwu/tasks:
   *   post:
   *     summary: 创建转录任务
   *     description: 创建音频转录任务，支持离线转录
   *     tags: [通义听悟]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/TranscriptionTask'
   *     responses:
   *       200:
   *         description: 转录任务创建成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 创建转录任务成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     taskId:
   *                       type: string
   *                     status:
   *                       type: string
   *       400:
   *         description: 无效的请求参数
   *       500:
   *         description: 服务器错误
   */
  async createTask(req, res) {
    try {
      const { type, input, parameters } = req.body;
      this.logger.info('createTask params:', { type, input, parameters });
      
      let parsedInput = input;
      let parsedParams = parameters;
      if (typeof parsedInput === 'string') parsedInput = JSON.parse(parsedInput);
      if (typeof parsedParams === 'string') parsedParams = JSON.parse(parsedParams);

      const taskOptions = {
        type: type || 'offline',
        input: { ...parsedInput },
        parameters: parsedParams
      };
      this.logger.info('taskOptions', taskOptions);

      const result = await transcriptionService.uploadAndTranscribe(taskOptions);
      this.logger.info('createTask result', result);
      return this.success(res, '创建转录任务成功', result);
    } catch (error) {
      this.logger.error('创建转录任务失败:', error);
      return this.fail(res, '创建转录任务失败', error, 500);
    }
  }

  /**
   * @swagger
   * /tingwu/tasks/{taskId}:
   *   get:
   *     summary: 获取任务状态和结果
   *     description: 根据任务ID获取转录任务的状态和结果
   *     tags: [通义听悟]
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *         description: 转录任务ID
   *     responses:
   *       200:
   *         description: 成功获取任务信息
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 获取任务信息成功
   *                 data:
   *                   type: object
   *                   properties:
   *                     taskId:
   *                       type: string
   *                     taskStatus:
   *                       type: string
   *                       enum: [ONGOING, COMPLETED, FAILED]
   *                     result:
   *                       type: object
   *                       properties:
   *                         transcription:
   *                           type: string
   *                           description: 转录结果URL
   *       400:
   *         description: 请求无效，可能是缺少taskId
   *       500:
   *         description: 服务器错误
   */
  async getTaskInfo(req, res) {
    try {
      const { taskId } = req.params;

      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数：taskId', null, 400);
      }

      // 调用通义听悟服务获取任务信息
      const result = await tingwuService.getTaskResult(taskId);
      return this.success(res, '获取任务信息成功', result.data);
    } catch (error) {
      this.logger.error('获取任务信息失败:', error);
      return this.fail(res, '获取任务信息失败', error, 500);
    }
  }

  /**
   * @swagger
   * /tingwu/tasks/{taskId}/poll:
   *   get:
   *     summary: 轮询任务结果直到完成
   *     description: 持续轮询任务状态直到任务完成或失败
   *     tags: [通义听悟]
   *     parameters:
   *       - in: path
   *         name: taskId
   *         required: true
   *         schema:
   *           type: string
   *         description: 转录任务ID
   *       - in: query
   *         name: maxAttempts
   *         schema:
   *           type: integer
   *           default: 30
   *         description: 最大轮询次数
   *       - in: query
   *         name: interval
   *         schema:
   *           type: integer
   *           default: 3000
   *         description: 轮询间隔(毫秒)
   *     responses:
   *       200:
   *         description: 转录任务完成
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 转录任务完成
   *                 data:
   *                   type: object
   *                   properties:
   *                     taskId:
   *                       type: string
   *                     taskStatus:
   *                       type: string
   *                     transcription:
   *                       type: string
   *                       description: 转录结果URL
   *       400:
   *         description: 请求无效，可能是缺少taskId
   *       500:
   *         description: 服务器错误
   */
  async pollTaskResult(req, res) {
    try {
      const { taskId } = req.params;
      const { maxAttempts, interval } = req.query;

      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数：taskId', null, 400);
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

      return this.success(res, '转录任务完成', simplifiedData);
    } catch (error) {
      this.logger.error('获取转录结果失败:', error);
      return this.fail(res, '获取转录结果失败', error, 500);
    }
  }

  /**
   * @swagger
   * /tingwu/fetch-json:
   *   post:
   *     summary: 获取JSON文件内容
   *     description: 从指定URL获取JSON文件内容
   *     tags: [通义听悟]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - url
   *             properties:
   *               url:
   *                 type: string
   *                 description: JSON文件的URL
   *     responses:
   *       200:
   *         description: 成功获取JSON文件内容
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 获取JSON文件内容成功
   *                 data:
   *                   type: object
   *                   description: 获取到的JSON数据
   *       400:
   *         description: 请求无效，可能是缺少URL
   *       500:
   *         description: 服务器错误
   */
  async fetchJsonContent(req, res) {
    try {
      const { url } = req.body;

      // 参数验证
      if (!url) {
        return this.fail(res, '缺少必要参数：url', null, 400);
      }

      // 获取JSON文件内容
      const response = await axios.get(url);
      return this.success(res, '获取JSON文件内容成功', response.data);
    } catch (error) {
      this.logger.error('获取JSON文件内容失败:', error);
      return this.fail(res, '获取JSON文件内容失败', error, 500);
    }
  }

  /**
   * @swagger
   * /tingwu/vocabularies:
   *   post:
   *     summary: 创建热词表
   *     description: 创建用于语音识别的热词表
   *     tags: [通义听悟]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - words
   *             properties:
   *               name:
   *                 type: string
   *                 description: 热词表名称
   *               words:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: 热词列表
   *     responses:
   *       200:
   *         description: 热词表创建成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *                 message:
   *                   type: string
   *                   example: 热词表创建成功
   *                 data:
   *                   type: object
   *                   description: 创建结果
   *       400:
   *         description: 请求无效，可能是缺少必要参数
   *       500:
   *         description: 服务器错误
   */
  async createVocabulary(req, res) {
    try {
      const { name, words } = req.body;

      // 参数验证
      if (!name || !words || !Array.isArray(words)) {
        return this.fail(res, '缺少必要参数：name和words数组', null, 400);
      }

      // 调用通义听悟服务创建热词表
      const result = await tingwuService.createVocabulary({
        name,
        words
      });

      return this.success(res, '热词表创建成功', result);
    } catch (error) {
      this.logger.error('创建热词表失败:', error);
      return this.fail(res, '创建热词表失败', error, 500);
    }
  }
}

export default new TingwuController();