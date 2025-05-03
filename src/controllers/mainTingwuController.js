// simpleTingwuController.js
// 简化版通义听悟控制器 - 只提供两个核心接口

import BaseController from './BaseController.js';
import mainTingwuService from '../services/mainTingwuService.js';

/**
 * 简化版通义听悟控制器
 * 只处理CreateTask和GetTaskInfo两个核心API对应的HTTP请求
 */
class MainTingwuController extends BaseController {
  constructor() {
    super('MainTingwuController');
  }

  /**
   * 创建通义听悟任务
   * @route POST /simple-tingwu/tasks
   */
  async createTask(req, res) {
    try {
      // 提取请求参数
      const { type, input, parameters, operation } = req.body;
      
      this.logger.info('创建通义听悟任务请求参数:', 
        { type, operation, inputKeys: input ? Object.keys(input) : [] });
      
      // 参数验证
      if (!type || !input) {
        return this.fail(res, '缺少必要参数: type和input', null, 400);
      }
      
      // 解析参数（如果是字符串）
      let parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
      let parsedParams = typeof parameters === 'string' ? JSON.parse(parameters) : parameters;
      
      // 调用服务创建任务
      const result = await mainTingwuService.createTask({
        type,
        input: parsedInput,
        parameters: parsedParams,
        operation
      });
      
      // 完全优化响应结构：直接提取任务ID和状态，添加requestId作为元数据
      const responseData = {
        taskId: result.data.taskId,
        taskStatus: result.data.taskStatus,
        requestId: result.requestId
      };
      
      // 请求成功
      return this.success(res, '成功创建通义听悟任务', responseData);
    } catch (error) {
      this.logger.error('创建通义听悟任务失败:', error);
      return this.fail(res, '创建通义听悟任务失败', error, error.statusCode || 500);
    }
  }

  /**
   * 获取通义听悟任务信息
   * @route GET /simple-tingwu/tasks/:taskId
   */
  async getTaskInfo(req, res) {
    try {
      // 获取任务ID
      const { taskId } = req.params;
      
      this.logger.info(`获取通义听悟任务信息: ${taskId}`);
      
      // 参数验证
      if (!taskId) {
        return this.fail(res, '缺少必要参数: taskId', null, 400);
      }
      
      // 调用服务获取任务信息
      const result = await mainTingwuService.getTaskInfo(taskId);
      
      // 优化响应结构：合并data和内部数据，避免嵌套，保留requestId
      const responseData = {
        taskId: result.data.taskId,
        taskStatus: result.data.taskStatus,
        requestId: result.requestId
      };
      
      // 如果有结果文件，添加到响应
      if (result.data.result) {
        responseData.result = result.data.result;
      }
      
      // 请求成功
      return this.success(res, '成功获取通义听悟任务信息', responseData);
    } catch (error) {
      this.logger.error('获取通义听悟任务信息失败:', error);
      return this.fail(res, '获取通义听悟任务信息失败', error, error.statusCode || 500);
    }
  }
}

// 创建单例实例
const mainTingwuController = new MainTingwuController();

export default mainTingwuController; 