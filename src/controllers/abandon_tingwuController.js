// tingwuController.js
// 通义听悟功能控制器

import BaseController from './BaseController.js';
import fileUploadService from '../services/fileUploadService.js';
import tingwuService from '../services/abandon_tingwuService.js';
import transcriptionService from '../services/abandon_transcriptionService.js';
import axios from 'axios';

/**
 * 通义听悟控制器
 * 处理音频转录相关的HTTP请求
 * 
 * 所有API文档都移至 src/swagger 目录下
 */
class TingwuController extends BaseController {
  constructor() {
    super('TingwuController');
  }

  /**
   * 上传音频文件
   * @route POST /tingwu/upload
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
   * 创建转录任务
   * @route POST /tingwu/tasks
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
   * 获取任务状态和结果
   * @route GET /tingwu/tasks/{taskId}
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
   * 轮询任务结果直到完成
   * @route GET /tingwu/tasks/{taskId}/poll
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
   * 获取JSON文件内容
   * @route POST /tingwu/fetch-json
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
   * 创建热词表
   * @route POST /tingwu/vocabularies
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

  /**
   * 创建实时翻译任务
   * @route POST /tingwu/realtime/start
   */
  async startRealtimeTask(req, res) {
    try {
      this.logger.info('创建实时翻译任务，请求参数：', req.body);
      
      // 获取基本参数
      const { 
        sourceLanguage, 
        format, 
        sampleRate, 
        translationEnabled = true, 
        targetLanguages = ['cn'],
        languageHints,
        diarizationEnabled = false, 
        speakerCount
      } = req.body;
      
      // 获取高级参数
      const {
        transcription = {},
        translation = {},
        autoChaptersEnabled = false,
        summarizationEnabled = false,
        summarization = {},
        textPolishEnabled = false,
        customPromptEnabled = false
      } = req.body;
      
      // 参数验证
      if (!sourceLanguage || !format || !sampleRate) {
        return this.fail(res, '缺少必要参数：sourceLanguage、format、sampleRate', null, 400);
      }
      
      // 创建实时任务配置
      const taskOptions = {
        // 基本参数
        sourceLanguage,
        format,
        sampleRate,
        translationEnabled,
        targetLanguages,
        languageHints,
        diarizationEnabled,
        speakerCount: diarizationEnabled ? (speakerCount || 2) : undefined,
        
        // 高级参数配置
        // 转录参数
        transcriptionOutputLevel: transcription.outputLevel || 2,
        phraseId: transcription.phraseId,
        
        // 翻译参数
        translationOutputLevel: translation.outputLevel || 2,
        
        // 额外功能
        autoChaptersEnabled,
        summarizationEnabled,
        summarizationTypes: summarization.types,
        textPolishEnabled,
        customPromptEnabled
      };
      
      // 调用服务创建实时任务
      const result = await tingwuService.createRealtimeTask(taskOptions);
      
      this.logger.info('创建实时翻译任务结果:', result);
      if (result.code === '0') {
        return this.success(res, '创建实时翻译任务成功', {
          taskId: result.data.taskId,
          taskStatus: result.data.taskStatus,
          taskKey: result.data.taskKey,
          requestId: result.requestId,
          meetingJoinUrl: result.data.meetingJoinUrl
        });
      } else {
        return this.fail(res, `创建实时翻译任务失败: ${result.message}`, null, 500);
      }
    } catch (error) {
      this.logger.error('创建实时翻译任务失败:', error);
      return this.fail(res, '创建实时翻译任务失败', error, 500);
    }
  }

  /**
   * 停止实时翻译任务
   * @route POST /tingwu/realtime/{taskId}/stop
   */
  async stopRealtimeTask(req, res) {
    try {
      const { taskId } = req.params;
      
      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数：taskId', null, 400);
      }
      
      // 调用服务停止实时任务
      const result = await tingwuService.stopRealtimeTask(taskId);
      
      if (result.code === '0') {
        return this.success(res, '停止实时翻译任务成功', {
          taskId,
          taskStatus: 'STOPPED',
          requestId: result.requestId
        });
      } else {
        return this.fail(res, `停止实时翻译任务失败: ${result.message}`, null, 500);
      }
    } catch (error) {
      this.logger.error('停止实时翻译任务失败:', error);
      return this.fail(res, '停止实时翻译任务失败', error, 500);
    }
  }

  /**
   * 获取WebSocket连接信息
   * @route GET /tingwu/realtime/websocket
   */
  async getWebSocketInfo(req, res) {
    try {
      const { taskId } = req.query;
      
      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数：taskId', null, 400);
      }
      
      // 获取任务信息，确保任务存在
      const taskInfo = await tingwuService.getTaskResult(taskId);
      
      if (!taskInfo || !taskInfo.data) {
        return this.fail(res, `未找到任务: ${taskId}`, null, 404);
      }
      
      // 生成访问令牌（可使用JWT或其他方式生成）
      const accessToken = `token-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
      
      // 创建WebSocket连接信息（实际应用中应从通义听悟服务获取）
      const websocketInfo = {
        websocketUrl: `wss://tingwu.cn-beijing.aliyuncs.com/ws/${taskId}`,
        taskId,
        accessToken,
        expiresIn: 3600 // 令牌过期时间（秒）
      };
      
      return this.success(res, '获取WebSocket连接信息成功', websocketInfo);
    } catch (error) {
      this.logger.error('获取WebSocket连接信息失败:', error);
      return this.fail(res, '获取WebSocket连接信息失败', error, 500);
    }
  }
  
  /**
   * 获取实时翻译任务结果
   * @route GET /tingwu/realtime/{taskId}/result
   */
  async getRealtimeTaskResult(req, res) {
    try {
      const { taskId } = req.params;
      
      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数：taskId', null, 400);
      }
      
      // 调用服务获取实时任务结果
      const taskResult = await tingwuService.getRealtimeTaskResult(taskId);
      
      if (!taskResult) {
        return this.fail(res, `未找到任务结果: ${taskId}`, null, 404);
      }
      
      // 直接返回服务层处理好的结果
      return this.success(res, '获取任务结果成功', taskResult);
    } catch (error) {
      this.logger.error('获取实时翻译任务结果失败:', error);
      return this.fail(res, '获取实时翻译任务结果失败', error, 500);
    }
  }
}

export default new TingwuController();